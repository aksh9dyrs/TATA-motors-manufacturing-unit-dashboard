import requests
from bs4 import BeautifulSoup
import re

def extract_manufacturing_keywords(question):
    """Extract manufacturing and mechanical keywords from the question"""
    manufacturing_terms = [
        'manufacturing', 'production', 'assembly', 'machining', 'welding', 'casting',
        'maintenance', 'repair', 'inspection', 'quality', 'efficiency', 'productivity',
        'automation', 'robotics', 'cnc', 'machinery', 'equipment', 'tools', 'materials',
        'process', 'operation', 'system', 'performance', 'optimization', 'improvement',
        'failure', 'breakdown', 'downtime', 'uptime', 'reliability', 'safety',
        'industrial', 'factory', 'plant', 'facility', 'workshop', 'production line'
    ]
    
    # Extract keywords from question
    question_lower = question.lower()
    found_keywords = [term for term in manufacturing_terms if term in question_lower]
    
    # Add context-specific terms based on question content
    if any(word in question_lower for word in ['event', 'incident', 'problem', 'issue']):
        found_keywords.extend(['manufacturing incident', 'industrial safety', 'equipment failure'])
    
    if any(word in question_lower for word in ['similar', 'compare', 'pattern']):
        found_keywords.extend(['manufacturing patterns', 'industrial analytics', 'predictive maintenance'])
    
    if any(word in question_lower for word in ['machine', 'equipment', 'device']):
        found_keywords.extend(['industrial machinery', 'manufacturing equipment', 'machine maintenance'])
    
    if any(word in question_lower for word in ['city', 'location', 'facility']):
        found_keywords.extend(['manufacturing facility', 'industrial plant', 'factory management'])
    
    return found_keywords

def search_wikipedia(query):
    try:
        # Extract manufacturing keywords from the question
        manufacturing_keywords = extract_manufacturing_keywords(query)
        
        # Create enhanced search terms
        search_terms = [query]  # Original query first
        if manufacturing_keywords:
            # Add manufacturing context to search
            search_terms.extend([f"{query} manufacturing", f"{query} industrial"])
            # Add specific manufacturing terms
            for keyword in manufacturing_keywords[:3]:  # Top 3 keywords
                search_terms.append(f"{keyword} {query}")
        
        # Try each search term until we find relevant results
        for search_term in search_terms:
            url = f"https://en.wikipedia.org/w/api.php"
            params = {
                "action": "query",
                "list": "search",
                "srsearch": search_term,
                "format": "json",
                "srlimit": 5  # Get more results to find better matches
            }
            resp = requests.get(url, params=params, timeout=3)
            data = resp.json()
            
            if data["query"]["search"]:
                # Look for manufacturing/industrial related articles first
                for article in data["query"]["search"]:
                    title = article["title"].lower()
                    snippet = article["snippet"].lower()
                    
                    # Check if article is manufacturing/industrial related
                    manufacturing_indicators = [
                        'manufacturing', 'industrial', 'factory', 'production', 'machinery',
                        'equipment', 'maintenance', 'automation', 'process', 'quality',
                        'safety', 'efficiency', 'productivity', 'machining', 'assembly'
                    ]
                    
                    is_manufacturing_related = any(indicator in title or indicator in snippet 
                                                 for indicator in manufacturing_indicators)
                    
                    if is_manufacturing_related or len(search_terms) == 1:  # Use if manufacturing-related or last resort
                        page_url = f"https://en.wikipedia.org/wiki/{article['title'].replace(' ', '_')}"
                        return {
                            "title": article["title"], 
                            "url": page_url,
                            "context": f"Manufacturing context: {search_term}"
                        }
        
        # Fallback to original search if no manufacturing results found
        url = f"https://en.wikipedia.org/w/api.php"
        params = {
            "action": "query",
            "list": "search",
            "srsearch": query,
            "format": "json"
        }
        resp = requests.get(url, params=params, timeout=2)
        data = resp.json()
        if data["query"]["search"]:
            title = data["query"]["search"][0]["title"]
            page_url = f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"
            return {"title": title, "url": page_url}
        return None
    except Exception as e:
        print(f"Wikipedia search error: {e}")
        return None

def search_google(query):
    # For demo, just return a Google search URL
    return {"title": "Google Search", "url": f"https://www.google.com/search?q={query}"} 