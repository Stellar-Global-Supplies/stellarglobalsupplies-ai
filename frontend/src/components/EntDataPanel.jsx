import { useState, useEffect } from "react";
import { useAuthStore, useChatStore } from "../lib/store.js";
import { Database, ChevronRight, Table, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "/api";

export default function EntDataPanel({ onClose }) {
  const { getHeaders } = useAuthStore();
  const { setEntTable, entTable } = useChatStore();
  const [tables, setTables] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sql, setSql] = useState("");
  const [queryResult, setQueryResult] = useState(null);
  const [tab, setTab] = useState("tables"); // tables | query

  useEffect(() => {
    fetch(`${API}/ent/tables`, { headers: getHeaders() })
      .then((r) => r.json())
      .then((d) => { if (d.error) setError(d.error); else setTables(d); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function previewTable(schema, table) {
    setPreview(null);
    const res = await fetch(`${API}/ent/tables/${schema}/${table}/preview`, { headers: getHeaders() });
    const data = await res.json();
    if (res.ok) {
      setPreview({ schema, table, ...data });
      setEntTable(`${schema}.${table}`);
    }
  }

  async function runQuery() {
    if (!sql.trim()) return;
    const res = await fetch(`${API}/ent/query`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ sql }),
    });
    const data = await res.json();
    setQueryResult(data);
  }

  return (
    <div className="fixed right-0 top-0 h-full w-[480px] bg-surface-1 border-l border-border z-40 flex flex-col animate-slide-up shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <Database size={18} className="text-gem-blue" />
          <span className="font-medium text-text-primary">Enterprise Data</span>
          <span className="text-xs bg-gem-blue/10 text-gem-blue px-2 py-0.5 rounded-full">Read-only</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-disabled hover:text-text-primary transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border shrink-0">
        {["tables", "query"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm capitalize transition-colors border-b-2 ${
              tab === t ? "border-gem-blue text-gem-blue" : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "tables" && (
          <div className="flex h-full">
            {/* Table list */}
            <div className="w-48 border-r border-border overflow-y-auto shrink-0">
              {loading && <p className="text-text-disabled text-xs p-3">Loading…</p>}
              {error && <p className="text-red-400 text-xs p-3">{error}</p>}
              {tables.map((t) => (
                <button
                  key={`${t.table_schema}.${t.table_name}`}
                  onClick={() => previewTable(t.table_schema, t.table_name)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
                    entTable === `${t.table_schema}.${t.table_name}`
                      ? "bg-gem-blue/10 text-gem-blue"
                      : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
                  }`}
                >
                  <Table size={11} />
                  <span className="truncate">{t.table_name}</span>
                  <ChevronRight size={10} className="ml-auto opacity-50" />
                </button>
              ))}
            </div>

            {/* Preview */}
            <div className="flex-1 overflow-auto p-3">
              {preview ? (
                <>
                  <div className="mb-2">
                    <p className="text-xs font-medium text-text-primary">{preview.table}</p>
                    <p className="text-xs text-text-disabled">{preview.schema} · {preview.rows?.length} rows shown</p>
                  </div>
                  <DataTable rows={preview.rows} />
                  <p className="text-xs text-text-disabled mt-2">
                    ✓ Using <span className="text-gem-blue">{entTable}</span> as context for AI
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-text-disabled text-sm">
                  Select a table to preview
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "query" && (
          <div className="p-4 flex flex-col gap-3">
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              placeholder="SELECT * FROM public.orders LIMIT 10"
              rows={5}
              className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3
                         text-text-primary placeholder-text-disabled font-mono text-xs resize-none
                         focus:outline-none focus:border-gem-blue transition-colors"
            />
            <button
              onClick={runQuery}
              className="px-4 py-2 rounded-xl bg-gem-accent hover:bg-gem-accent/90 text-white text-sm font-medium transition-all self-start"
            >
              Run Query
            </button>
            {queryResult && (
              <div className="mt-2">
                {queryResult.error
                  ? <p className="text-red-400 text-xs">{queryResult.error}</p>
                  : <>
                      <p className="text-xs text-text-disabled mb-2">{queryResult.count} rows</p>
                      <DataTable rows={queryResult.rows} />
                    </>
                }
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DataTable({ rows }) {
  if (!rows?.length) return <p className="text-text-disabled text-xs">No data</p>;
  const cols = Object.keys(rows[0]);
  return (
    <div className="overflow-auto rounded-lg border border-border">
      <table className="text-xs w-full">
        <thead>
          <tr className="bg-surface-2">
            {cols.map((c) => (
              <th key={c} className="px-3 py-2 text-left text-text-disabled font-medium whitespace-nowrap border-b border-border">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "" : "bg-surface-2/50"}>
              {cols.map((c) => (
                <td key={c} className="px-3 py-2 text-text-primary whitespace-nowrap max-w-[150px] truncate border-b border-border/50">
                  {row[c] == null ? <span className="text-text-disabled italic">null</span> : String(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
