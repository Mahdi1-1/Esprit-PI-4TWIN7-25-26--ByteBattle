from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb

class XGBoostWrapper(BaseEstimator, ClassifierMixin):
    """Wraps XGBClassifier with a LabelEncoder so it handles non-contiguous
    integer labels (e.g. levels 2-5 when level 1 is absent) and remains
    fully picklable via joblib."""

    def __init__(self, **xgb_params):
        self.xgb_params = xgb_params
        self._clf = None
        self._le = None
        self.classes_ = None

    def fit(self, X, y):
        self._le = LabelEncoder()
        y_enc = self._le.fit_transform(y)
        self.classes_ = self._le.classes_
        self._clf = xgb.XGBClassifier(**self.xgb_params)
        self._clf.fit(X, y_enc)
        return self

    def predict(self, X):
        y_enc = self._clf.predict(X).astype(int)
        return self._le.inverse_transform(y_enc)

    def predict_proba(self, X):
        return self._clf.predict_proba(X)
