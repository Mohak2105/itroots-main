import toast from "react-hot-toast";
import { createRoot } from "react-dom/client";

export const showDeleteConfirmation = (
  itemName: string,
  onConfirm: () => Promise<void> | void
) => {
  toast(
    (t) => (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "4px" }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem", color: "#0f172a" }}>
          Delete {itemName}?
        </p>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b", lineHeight: 1.4 }}>
          This action cannot be undone. Are you sure you want to proceed?
        </p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "8px" }}>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              padding: "6px 14px",
              fontSize: "0.8rem",
              fontWeight: 600,
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#f8fafc",
              color: "#334155",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await onConfirm();
                toast.success(`${itemName} deleted successfully`, {
                    style: {
                        borderRadius: "10px",
                        background: "#10b981",
                        color: "#fff",
                        fontWeight: 600,
                    },
                    iconTheme: {
                        primary: "#fff",
                        secondary: "#10b981",
                    }
                });
              } catch (err) {
                toast.error(`Failed to delete ${itemName.toLowerCase()}`);
              }
            }}
            style={{
              padding: "6px 14px",
              fontSize: "0.8rem",
              fontWeight: 600,
              borderRadius: "8px",
              border: "none",
              background: "#ef4444",
              color: "#fff",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    ),
    { 
      duration: Infinity, 
      id: "delete-confirm",
      style: {
          border: "1px solid #e2e8f0",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          padding: "16px",
          minWidth: "300px",
          borderRadius: "16px",
      }
    }
  );
};

export const showStatusConfirmation = (
  itemName: string,
  currentlyActive: boolean,
  onConfirm: () => Promise<void> | void
) => {
  const newStatus = currentlyActive ? "Inactive" : "Active";
  const actionColor = currentlyActive ? "#f59e0b" : "#10b981";

  // Create a container for the modal
  const container = document.createElement("div");
  container.id = "status-confirm-overlay";
  document.body.appendChild(container);

  const cleanup = () => {
    const existing = document.getElementById("status-confirm-overlay");
    if (existing) {
      document.body.removeChild(existing);
    }
  };

  const root = createRoot(container);

  root.render(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        background: "rgba(0, 0, 0, 0.35)",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={() => {
        root.unmount();
        cleanup();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "2rem 2.25rem",
          minWidth: "400px",
          maxWidth: "460px",
          boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          animation: "scaleIn 0.2s ease",
        }}
      >
        {/* Icon */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: currentlyActive ? "#fef3c7" : "#d1fae5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.6rem",
            }}
          >
            {currentlyActive ? "⚠️" : "✅"}
          </div>
        </div>

        <p style={{ margin: 0, fontWeight: 700, fontSize: "1.15rem", color: "#0f172a", textAlign: "center" }}>
          Set {itemName} as {newStatus}?
        </p>
        <p style={{ margin: 0, fontSize: "0.92rem", color: "#64748b", lineHeight: 1.5, textAlign: "center" }}>
          {currentlyActive
            ? `This will deactivate the ${itemName.toLowerCase()}. They will no longer be able to access the portal.`
            : `This will reactivate the ${itemName.toLowerCase()}. They will regain access to the portal.`}
        </p>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "12px" }}>
          <button
            onClick={() => {
              root.unmount();
              cleanup();
            }}
            style={{
              padding: "10px 24px",
              fontSize: "0.9rem",
              fontWeight: 600,
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              color: "#334155",
              cursor: "pointer",
              transition: "all 0.2s",
              minWidth: "100px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              root.unmount();
              cleanup();
              try {
                await onConfirm();
                toast.success(`${itemName} set to ${newStatus}`, {
                  style: {
                    borderRadius: "10px",
                    background: actionColor,
                    color: "#fff",
                    fontWeight: 600,
                  },
                  iconTheme: {
                    primary: "#fff",
                    secondary: actionColor,
                  },
                });
              } catch (err) {
                toast.error(`Failed to update ${itemName.toLowerCase()} status`);
              }
            }}
            style={{
              padding: "10px 24px",
              fontSize: "0.9rem",
              fontWeight: 600,
              borderRadius: "12px",
              border: "none",
              background: actionColor,
              color: "#fff",
              cursor: "pointer",
              transition: "all 0.2s",
              minWidth: "100px",
            }}
          >
            Yes, {currentlyActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
