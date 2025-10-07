import { Table } from "antd";

const CustomTable = ({
  dataSource,
  columns,
  pagination = true,
  scroll,
  pageSizeOptions = ["10", "20", "50", "100"],
  visibleColumns, // Array of dataIndex to show
}) => {
  // Filter columns based on visibleColumns if provided
  const filteredColumns = visibleColumns
    ? columns.filter(
        (col) => visibleColumns.includes(col.dataIndex) || col.key === "action"
      )
    : columns;

  return (
    <div
      className="border rounded-lg bg-secondary-100 w-full"
      style={{
        maxWidth: "calc(100vw - var(--sidebar-width))",
        overflowX: "auto",
      }}
    >
      <Table
        dataSource={dataSource}
        columns={filteredColumns}
        scroll={scroll ?? { x: "100%" }}
        tableLayout="auto"
        pagination={
          pagination
            ? {
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: pageSizeOptions,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
                position: ["bottomCenter"],
              }
            : false
        }
      />
    </div>
  );
};

export default CustomTable;
