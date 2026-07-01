from backend.graphs import founder_graph


def test_planner_starts_with_first_workflow_node(monkeypatch):
    calls = []

    monkeypatch.setitem(
        founder_graph.NODE_REGISTRY,
        "planner",
        founder_graph.create_node_wrapper(
            "planner",
            lambda query: {
                "workflow": ["retrieval", "scoring"],
                "explanation": "test"
            }
        )
    )
    monkeypatch.setitem(
        founder_graph.NODE_REGISTRY,
        "retrieval",
        founder_graph.create_node_wrapper(
            "retrieval",
            lambda query, db, qdrant, owner_id: (
                calls.append("retrieval")
                or {"retrieved_context": {"investor": None, "memories": []}}
            )
        )
    )
    monkeypatch.setitem(
        founder_graph.NODE_REGISTRY,
        "scoring",
        founder_graph.create_node_wrapper(
            "scoring",
            lambda retrieved_context, db, owner_id: (
                calls.append("scoring")
                or {"scores": {}}
            )
        )
    )

    graph = founder_graph.get_graph()
    result = graph.invoke({
        "query": "test",
        "owner_id": 123,
        "db": object(),
        "qdrant": object(),
        "current_index": 0,
        "workflow": []
    })

    assert calls == ["retrieval", "scoring"]
    assert result["current_index"] == 2
