import requests
from config import SAMBANOVA_API_KEY, DATABASE_URL, LOCAL_MODE
import time
from rag_utils import search_wikipedia, search_google
from db import get_similar_events
from sqlalchemy import create_engine, text
import os

def local_summary(events):
    return {
        "summary": f"Found {len(events)} events. Most common: ... (local mode fallback)",
        "confidence": 0.5,
        "source": "local",
        "timestamp": time.time()
    }

def get_event_context(events):
    return str(events)

def get_wikipedia_info(query):
    result = search_wikipedia(query)
    if result:
        return f"Wikipedia: {result['title']} - {result['url']}"
    return "No relevant Wikipedia article found."

def get_google_info(query):
    result = search_google(query)
    if result:
        return f"Google: {result['title']} - {result['url']}"
    return "No relevant Google result found."

def extract_sambanova_text(result):
    # Handles both string and list content in SambaNova response
    try:
        content = result["choices"][0]["message"]["content"]
        if isinstance(content, list):
            texts = [c["text"] for c in content if isinstance(c, dict) and c.get("type") == "text" and "text" in c]
            return "\n".join(texts)
        elif isinstance(content, str):
            return content
        else:
            return str(content)
    except Exception as e:
        return str(result)

def patch_sql_ilike(sql):
    # Patch SQL to use ILIKE for event_type queries
    import re
    # Replace only for event_type = '...'
    return re.sub(r"event_type\s*=\s*'([A-Za-z]+)'", r"event_type ILIKE '\1'", sql)

def convert_bullets_to_html(text):
    """Convert markdown-style bullet points to HTML bullet points"""
    import re
    
    # Convert #, *, + bullet points to HTML bullets
    # Handle different indentation levels
    lines = text.split('\n')
    converted_lines = []
    
    for line in lines:
        # Match bullet points at start of line (with optional spaces)
        if re.match(r'^\s*[#*+]\s+', line):
            # Convert to HTML bullet
            line = re.sub(r'^\s*[#*+]\s+', '• ', line)
        converted_lines.append(line)
    
    return '\n'.join(converted_lines)

def format_table_markdown(rows):
    if not rows:
        return "No results found."
    headers = rows[0].keys()
    lines = ["| " + " | ".join(headers) + " |", "| " + " | ".join(["---"] * len(headers)) + " |"]
    for row in rows:
        lines.append("| " + " | ".join(str(row[h]) for h in headers) + " |")
    return "\n".join(lines)

def format_table_html(rows):
    if not rows:
        return "<div>No results found.</div>"
    headers = list(rows[0].keys())
    table = [
        '<table style="border-collapse:collapse;width:100%;">',
        '<thead><tr style="background-color:#f2f2f2; color:#000;">' + ''.join(f'<th style="border:1px solid #ddd;padding:8px;color:#000;">{h}</th>' for h in headers) + '</tr></thead>',
        '<tbody>'
    ]
    for i, row in enumerate(rows):
        bg = '#ffffff' if i % 2 == 0 else '#f9f9f9'
        table.append('<tr style="background-color:{}; color:#000;">'.format(bg) + ''.join(f'<td style="border:1px solid #ddd;padding:8px;color:#000;">{row[h]}</td>' for h in headers) + '</tr>')
    table.append('</tbody></table>')
    return '\n'.join(table)

def get_sql_from_sambanova(question):
    system_prompt = (
        "You are a helpful assistant for a manufacturing events database. "
        "Given a user's question, generate a valid SQL SELECT query for a PostgreSQL database. "
        "The table is 'manufacturing_events' with columns: id, event_type, duration_minutes, timestamp, notes, embedding, city, machine_name. "
        "Only return the SQL query, nothing else."
    )
    url = "https://api.sambanova.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {SAMBANOVA_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "stream": False,
        "model": "Llama-4-Maverick-17B-128E-Instruct",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": f"{system_prompt}\n\n{question}"}
                ]
            }
        ]
    }
    response = requests.post(url, headers=headers, json=data)
    response.raise_for_status()
    result = response.json()
    sql = extract_sambanova_text(result).strip()
    if sql.startswith("```sql"):
        sql = sql[6:]
    if sql.endswith("```"):
        sql = sql[:-3]
    return sql.strip()

def get_similar_events_info(event_id):
    try:
        similar = get_similar_events(event_id)
        if not similar:
            return "No similar events found."
        return f"Top similar events to {event_id}:\n" + "\n".join([
            f"ID: {e['id']}, Type: {e['event_type']}, Machine: {e['machine_name']}, Similarity: {e['similarity']:.2f}" for e in similar
        ])
    except Exception as e:
        return f"Error in similarity search: {str(e)}"

def query_database(query):
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            result = conn.execute(text(query))
            rows = result.fetchall()
            return "\n".join([str(row) for row in rows])
    except Exception as e:
        return f"Error running SQL query: {str(e)}"

def analyze_events(events, question):
    print("DEBUG: analyze_events called. LOCAL_MODE =", LOCAL_MODE)
    print("DEBUG: SAMBANOVA_API_KEY =", SAMBANOVA_API_KEY)
    start_time = time.time()
    if LOCAL_MODE:
        print("DEBUG: Returning local_summary due to LOCAL_MODE")
        return local_summary(events)

    # 1. Try to get SQL from SambaNova
    try:
        sql = get_sql_from_sambanova(question)
        print("DEBUG: SQL from SambaNova (raw):", sql)
        sql = patch_sql_ilike(sql)
        print("DEBUG: SQL after patching for ILIKE:", sql)
        if not sql.lower().strip().startswith("select"):
            raise ValueError("SambaNova did not return a SELECT query.")
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            result = conn.execute(text(sql))
            rows = [dict(row._mapping) for row in result]
        # Summarize results with SambaNova
        summary_prompt = (
            f"User question: {question}\n\n"
            f"Database Results:\n{rows}\n\n"
            f"Please provide a comprehensive, detailed analysis that includes:\n"
            f"1. **Executive Summary**: A high-level overview of the findings\n"
            f"2. **Detailed Analysis**: Deep dive into the data patterns, trends, and insights\n"
            f"3. **Key Metrics**: Important statistics and performance indicators\n"
            f"4. **Pattern Recognition**: Identify recurring patterns or anomalies\n"
            f"5. **Operational Insights**: Practical implications for manufacturing operations\n"
            f"6. **Recommendations**: Actionable suggestions based on the analysis\n"
            f"7. **Risk Assessment**: Potential issues or areas of concern\n"
            f"8. **Future Trends**: Predictions or trends based on the data\n\n"
            f"Make the analysis thorough, professional, and actionable. Include specific numbers, percentages, and detailed explanations. "
            f"Structure the response with clear sections and use bullet points where appropriate. "
            f"The response should be comprehensive enough to provide valuable insights for manufacturing decision-makers."
        )
        url = "https://api.sambanova.ai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {SAMBANOVA_API_KEY}",
            "Content-Type": "application/json"
        }
        data = {
            "stream": False,
            "model": "Llama-4-Maverick-17B-128E-Instruct",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": summary_prompt}
                    ]
                }
            ]
        }
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        answer = extract_sambanova_text(result)
        table_html = format_table_html(rows)
        latency = time.time() - start_time
        
        # Create metrics section
        metrics_html = f"""
        <div style='margin:16px 0;padding:12px;background:#f8f8ff;border:1px solid #bdbdbd;border-radius:8px;'>
          <div style='text-align:center;margin-bottom:12px;'>
            <h4 style='margin:0;color:#222;font-weight:bold;font-size:1.1em;'>RAG METRICS</h4>
          </div>
          <div style='display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;'>
            <div style='color:#222;font-weight:bold;'>Confidence: <span style='color:#4CAF50;'>{(0.95 * 100):.1f}%</span></div>
            <div style='color:#222;font-weight:bold;'>Retrieved Rows: <span style='color:#FF9800;'>{len(rows)}</span></div>
            <div style='color:#222;font-weight:bold;'>Latency: <span style='color:#2196F3;'>{latency:.2f}s</span></div>
          </div>
        </div>
        """
        
        clean_summary = f"<div style='margin-bottom:24px;'><b>Summary Report:</b><br><div style='white-space:pre-line;margin-top:8px;margin-bottom:16px;'>{convert_bullets_to_html(answer.strip())}</div></div>" \
                        + metrics_html \
                        + f"<div><b>Query Results:</b><br>{table_html}</div>"
        print("DEBUG: SambaNova summary answer:", clean_summary)
        return {
            "summary": clean_summary,
            "data": rows,
            "confidence": 0.95,
            "source": "sambanova+sql",
            "timestamp": time.time(),
            "rag_recall": len(rows),
            "rag_latency": latency
        }
    except Exception as e:
        print("DEBUG: Exception in analyze_events (SambaNova SQL path):", e)
        log_api_failure(str(e))
        # Fallback to old method
        try:
            event_context = get_event_context(events)
            wiki_info = get_wikipedia_info(question)
            google_info = get_google_info(question)
            prompt = f"You are an expert manufacturing analytics assistant with deep knowledge of industrial processes, predictive maintenance, and operational excellence. Analyze the following information and provide a comprehensive, detailed answer.\n\nQuestion: {question}\n\nManufacturing Events Data:\n{event_context}\n\nExternal Knowledge Sources:\nWikipedia Information: {wiki_info}\nGoogle Search Results: {google_info}\n\nPlease provide a thorough, professional analysis that includes:\n\n1. **Executive Summary**: High-level overview of the findings and key insights\n2. **Data Analysis**: Detailed examination of the manufacturing events, including patterns, trends, and anomalies\n3. **External Context**: Integration of relevant industry knowledge and best practices from external sources\n4. **Operational Impact**: How the findings affect manufacturing operations, efficiency, and productivity\n5. **Technical Insights**: Deep technical analysis of machine behavior, event correlations, and system performance\n6. **Risk Assessment**: Identification of potential operational risks, maintenance issues, or quality concerns\n7. **Strategic Recommendations**: Actionable recommendations for process improvement, maintenance scheduling, and operational optimization\n8. **Industry Benchmarking**: Comparison with industry standards and best practices\n9. **Predictive Insights**: Future trends and predictive analysis based on current data patterns\n10. **Implementation Roadmap**: Step-by-step guidance for implementing the recommendations\n\nMake the analysis comprehensive, data-driven, and actionable. Include specific metrics, percentages, and detailed explanations. Structure the response with clear sections, use bullet points for key findings, and provide concrete examples. The response should be detailed enough to serve as a professional manufacturing analytics report."
            url = "https://api.sambanova.ai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {SAMBANOVA_API_KEY}",
                "Content-Type": "application/json"
            }
            data = {
                "stream": False,
                "model": "Llama-4-Maverick-17B-128E-Instruct",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt}
                        ]
                    }
                ]
            }
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            result = response.json()
            answer = extract_sambanova_text(result)
            print("DEBUG: SambaNova fallback answer:", answer)
            latency = time.time() - start_time
            return {
                "summary": convert_bullets_to_html(answer),
                "confidence": 0.95,
                "source": "sambanova-fallback",
                "timestamp": time.time(),
                "rag_recall": len(events),
                "rag_latency": latency
            }
        except Exception as e2:
            print("DEBUG: Exception in analyze_events (SambaNova fallback path):", e2)
            log_api_failure(str(e2))
            return local_summary(events)

def summarize_events(events, question="Summarize the recent manufacturing events."):
    return analyze_events(events, question)

def log_api_failure(msg):
    with open("logs/api_failures.log", "a") as f:
        f.write(f"{time.ctime()} | {msg}\n")