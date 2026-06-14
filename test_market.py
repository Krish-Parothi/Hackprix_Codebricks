import sys
sys.path.append(r"C:\Hackprix_Codebricks\backend")
from agent.market import market_agent_node
import json

if __name__ == "__main__":
    res = market_agent_node({"ticker": "NVDA"})
    print("Agent Response:")
    print(res)
    try:
        json.dumps(res)
        print("JSON Serialization SUCCESS")
    except Exception as e:
        print("JSON Serialization FAILED:", e)
