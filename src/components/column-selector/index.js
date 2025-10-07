import { Button, Checkbox, Divider, Popover } from "antd";
import { Settings } from "lucide-react";

const SelectedColumn = ({ columns, visibleColumns, setVisibleColumns }) => {
  // Column selector logic
  const options = columns
    .filter((col) => col.key !== "action")
    .map((col) => ({ label: col.title, value: col.key }));

  const allColumnValues = options.map((opt) => opt.value);
  const isAllSelected = allColumnValues.every((val) =>
    visibleColumns.includes(val)
  );
  const isIndeterminate =
    visibleColumns.some((val) => allColumnValues.includes(val)) &&
    !isAllSelected;

  const handleSelectAll = (checked) => {
    if (checked) {
      setVisibleColumns([
        ...visibleColumns.filter((col) => !allColumnValues.includes(col)),
        ...allColumnValues,
      ]);
    } else {
      setVisibleColumns(
        visibleColumns.filter((col) => !allColumnValues.includes(col))
      );
    }
  };

  const handleColumnChange = (columnValue, checked) => {
    if (checked) {
      setVisibleColumns([...visibleColumns, columnValue]);
    } else {
      setVisibleColumns(visibleColumns.filter((col) => col !== columnValue));
    }
  };

  return (
    <Popover
      content={
        <div style={{ minWidth: 200 }}>
          <Checkbox
            indeterminate={isIndeterminate}
            checked={isAllSelected}
            onChange={(e) => handleSelectAll(e.target.checked)}
          >
            Hiện tất cả
          </Checkbox>
          <Divider style={{ margin: "8px 0" }} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {options.map((option) => (
              <Checkbox
                key={option.value}
                checked={visibleColumns.includes(option.value)}
                onChange={(e) =>
                  handleColumnChange(option.value, e.target.checked)
                }
              >
                {option.label}
              </Checkbox>
            ))}
          </div>
        </div>
      }
      title="Chọn cột hiển thị"
      trigger="click"
      placement="bottomRight"
    >
      <Button className="flex items-center justify-center" shape="default">
        <Settings size={16} style={{ marginTop: "2px" }} />
      </Button>
    </Popover>
  );
};

export default SelectedColumn;
