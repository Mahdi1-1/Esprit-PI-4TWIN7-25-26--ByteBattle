import requests
import json

BASE_URL = "http://127.0.0.1:8001"

def test_ab_sum():
    target_problem = "Sum A+B"
    print(f"🔮 Test du Modèle d'IA (Prédiction de Niveau) pour le problème personnalisé: {target_problem}")
    
    # 1. Prediction using XGboost using code metrics (0 tags, 3 errors, 50 chars length)
    payload_pred = {
        "problem_name": target_problem,
        "language": "PYTHON3",
        "code_length": 50,
        "wrong_answer_count": 3,
        "cf_tags_override": ["math", "implementation"] # Simulating tags extracted from MongoDB
    }
    
    res_pred = requests.post(f"{BASE_URL}/predict-level", json=payload_pred)
    print(f"Prediction ML: {json.dumps(res_pred.json(), indent=2)}\n")
    print("="*60)

    # 2. Testing all 5 Hint levels
    print("💡 Test des 5 Niveaux de Hints pour Sum A+B...")
    for level in range(1, 6):
        print(f"\n🟢 NIVEAU {level} :")
        res_hint = requests.post(
            f"{BASE_URL}/hint", 
            json={
                "problem_name": target_problem, 
                "level": level,
                "cf_tags_override": ["math", "implementation"],
                "snippet_override": "a, b = map(int, input().split())",
                "full_solution_override": "a, b = map(int, input().split())\nprint(a + b)"
            }
        )
        hint_data = res_hint.json()
        print(hint_data.get("hint_text", hint_data))
        print("-" * 60)

if __name__ == "__main__":
    test_ab_sum()
