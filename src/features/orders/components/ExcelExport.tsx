import * as XLSX from "xlsx";
import { Button } from "../../../components/ui/Button";
import type { Order } from "../../../types";
import { useCompany } from "../../../hooks/useCompany";

interface ExcelExportProps {
  orders: Order[];
  filename?: string;
}

export function ExcelExport({ orders, filename = "orders" }: ExcelExportProps) {
  const { company } = useCompany();
  const zones = company?.settings.zones ?? [];

  const exportToExcel = () => {
    const data = orders.map((o) => ({
      "#": o.orderNumber,
      "Customer Name": o.customerName,
      Phone: o.phone,
      Address: o.address,
      Zone: zones.find((z) => z.id === o.zone)?.name ?? o.zone,
      Price: o.price,
      "Delivery Fee": o.deliveryFee,
      Total: o.price + o.deliveryFee,
      "Payment Method": o.paymentMethod,
      "Payment Status": o.paymentStatus,
      Status: o.status,
      Source: o.source,
      Notes: o.notes,
      "Delivery Date": o.deliveryDate?.toDate().toLocaleDateString() ?? "",
      "Created At": o.createdAt?.toDate().toLocaleString() ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  return (
    <Button variant="secondary" onClick={exportToExcel}>
      Export Excel
    </Button>
  );
}
