const AdminTable = ({ columns = [], rows = [], emptyMessage = 'No records yet.', rowKey = '_id', renderRowActions, renderCell }) => {
  const getCellContent = (row, column) => (renderCell ? renderCell(row, column) : row[column.key] || '—');

  return (
    <div className="admin-table-shell">
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
              {renderRowActions ? <th>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {!rows.length ? (
              <tr>
                <td colSpan={columns.length + (renderRowActions ? 1 : 0)} className="admin-table__empty">{emptyMessage}</td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row[rowKey] || `${rowKey}-${index}`}>
                  {columns.map((column) => (
                    <td key={column.key} data-label={column.label}>{getCellContent(row, column)}</td>
                  ))}
                  {renderRowActions ? <td data-label="Actions">{renderRowActions(row)}</td> : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-table-cards">
        {!rows.length ? (
          <div className="admin-table-card admin-table-card--empty">{emptyMessage}</div>
        ) : (
          rows.map((row, index) => (
            <article className="admin-table-card" key={row[rowKey] || `${rowKey}-card-${index}`}>
              {columns.map((column) => (
                <div className="admin-table-card__row" key={column.key}>
                  <span className="admin-table-card__label">{column.label}</span>
                  <div className="admin-table-card__value">{getCellContent(row, column)}</div>
                </div>
              ))}
              {renderRowActions ? (
                <div className="admin-table-card__actions">
                  {renderRowActions(row)}
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminTable;
