import json
import requests

BASE_URL = "http://127.0.0.1:8001"


def _base_payload():
    return {
        "user_id": "u_test_001",
        "challenge_id": "ch_test_001",
        "challenge_name": "Two Sum Variant",
        "difficulty": 2,
        "cf_rating": 1450,
        "minutes_stuck": 21.0,
        "attempts_count": 3,
        "last_hint_level": 1,
        "challenge_tags": ["implementation", "data structures", "hashing"],
        "code_lines": 52,
    }


def run_tests():
    print("\n=== ByteBattle Intelligence Engine API Test ===")

    health = requests.get(f"{BASE_URL}/health", timeout=10)
    print("/health:", health.status_code, health.json())

    submit = requests.post(f"{BASE_URL}/submit", json=_base_payload(), timeout=20)
    print("/submit:", submit.status_code)
    print(json.dumps(submit.json(), indent=2))

    get_hint = requests.post(f"{BASE_URL}/get-hint", json=_base_payload(), timeout=20)
    print("/get-hint:", get_hint.status_code)
    print(json.dumps(get_hint.json(), indent=2))

    profile_payload = _base_payload()
    profile_payload["current_skills"] = {
        "algo": 42.0,
        "data_structures": 38.0,
        "dynamic_programming": 27.0,
        "graphs": 30.0,
        "debugging": 45.0,
        "clean_code": 35.0,
        "speed": 32.0,
    }
    profile_payload["top_k"] = 4

    profile = requests.post(f"{BASE_URL}/profile", json=profile_payload, timeout=20)
    print("/profile:", profile.status_code)
    print(json.dumps(profile.json(), indent=2))

    compat_payload = {
        "problem_name": "Two Sum Variant",
        "language": "PYTHON3",
        "code_length": 280,
        "wrong_answer_count": 3,
        "cf_tags_override": ["implementation", "data structures"],
    }
    compat = requests.post(f"{BASE_URL}/predict-level", json=compat_payload, timeout=20)
    print("/predict-level:", compat.status_code)
    print(json.dumps(compat.json(), indent=2))


if __name__ == "__main__":
    run_tests()
