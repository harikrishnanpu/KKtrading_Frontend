const COLORS = {
    pending:       'bg-gray-300 text-gray-800',
    resolved:      'bg-green-200 text-green-800',
    not_resolved:  'bg-yellow-200 text-yellow-800',
    have_bugs:     'bg-red-200 text-red-800',
  };
  
  export default function StatusBadge({ status }) {
    return (
      <span className={`px-2 py-[2px] rounded text-[10px] font-bold ${COLORS[status] || ''}`}>
        {status.replace('_', ' ')}
      </span>
    );
  }
  