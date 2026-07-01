from typing import Protocol
from backend.graphs.state import FounderGraphState

class Agent(Protocol):
    def run(self, state: FounderGraphState) -> FounderGraphState:
        ...
