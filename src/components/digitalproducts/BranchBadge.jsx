// src/components/digitalProducts/BranchBadge.jsx
import { BRANCH_COLORS } from "../../constants/digitalProduct.constants";

export default function BranchBadge({ branch, size = "sm" }) {
  const c = BRANCH_COLORS[branch] || BRANCH_COLORS.Common;
  const sizeCls = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-bold uppercase tracking-wide ${sizeCls}`}
      style={{ background: c.pill, borderColor: c.border, color: c.dot }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {branch}
    </span>
  );
}