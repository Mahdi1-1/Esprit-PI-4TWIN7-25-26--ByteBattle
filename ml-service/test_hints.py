import requests
import json
import time

BASE_URL = "http://127.0.0.1:8001"

def test_api():
    try:
        print("🔍 1. Recherche d'un problème indexé...")
        resp = requests.get(f"{BASE_URL}/problems")
        resp.raise_for_status()
        problems = resp.json()["problems"]
        
        if not problems:
            print("❌ Aucun problème indexé.")
            return

        # On prend le premier problème disponible
        target_problem = problems[0]
        print(f"✅ Problème sélectionné : {target_problem}\n")

        print("🔮 2. Test du Modèle d'IA (Prédiction de Niveau)...")
        # On simule un étudiant qui galère (4 erreurs, code plutôt long)
        payload_pred = {
            "problem_name": target_problem,
            "language": "PYTHON3",
            "code_length": 800,
            "wrong_answer_count": 4
        }
        res_pred = requests.post(f"{BASE_URL}/predict-level", json=payload_pred)
        print("Input = 800 caractères, 4 erreurs ->", json.dumps(res_pred.json(), indent=2))
        print("\n" + "="*60)

        print("💡 3. Test des 5 Niveaux de Hints...")
        for level in range(1, 6):
            print(f"\n🟢 NIVEAU {level} :")
            res_hint = requests.post(
                f"{BASE_URL}/hint", 
                json={"problem_name": target_problem, "level": level}
            )
            hint_data = res_hint.json()
            # Afficher seulement le texte rendu
            print(hint_data.get("hint_text", "Erreur réseau"))
            print("-" * 60)

    except requests.exceptions.ConnectionError:
        print("❌ L'API n'est pas joignable ! Assurez vous d'avoir lancé `uvicorn api.main:app --port 8001` d'abord.")


if __name__ == "__main__":
    test_api()
