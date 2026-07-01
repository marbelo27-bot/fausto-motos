"use client";
import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";

type PeriodType = "month" | "year";

export default function Reports() {
  const payments = useStore((s) => s.payments);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [viewMode, setViewMode] = useState<"year" | "month">("month");

  // Get unique years from payments
  const years = useMemo(() => {
    const yearSet = new Set(payments.map(p => p.date.split("-")[0]));
    return Array.from(yearSet).map(Number).sort((a, b) => b - a);
  }, [payments]);

  // If no years, add current year
  if (years.length === 0) years.push(new Date().getFullYear());

  // Calculate monthly data for selected year
  const monthlyData = useMemo(() => {
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    return months.map((month, index) => {
      const monthNumber = index + 1;
      const monthPayments = payments.filter(p => {
        const [year, month] = p.date.split("-");
        return parseInt(year) === selectedYear && parseInt(month) === monthNumber;
      });

      const totalIncome = monthPayments.reduce((sum, p) => sum + p.amount, 0);

      return {
        month,
        monthNumber,
        totalIncome,
        paymentCount: monthPayments.length,
      };
    });
  }, [payments, selectedYear]);

  // Calculate daily data for selected month
  const dailyData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const dailyBreakdown: { day: number; income: number; payments: number }[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayString = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayPayments = payments.filter(p => p.date === dayString);
      const dayIncome = dayPayments.reduce((sum, p) => sum + p.amount, 0);

      dailyBreakdown.push({
        day,
        income: dayIncome,
        payments: dayPayments.length,
      });
    }

    return dailyBreakdown;
  }, [payments, selectedYear, selectedMonth]);

  // Calculate totals
  const yearlyTotal = monthlyData.reduce((sum, month) => sum + month.totalIncome, 0);
  const monthlyTotal = dailyData.reduce((sum, day) => sum + day.income, 0);
  const monthlyPaymentCount = dailyData.reduce((sum, day) => sum + day.payments, 0);

  // Find best and worst months
  const bestMonth = monthlyData.reduce((best, current) => current.totalIncome > best.totalIncome ? current : best, monthlyData[0]);
  const worstMonth = monthlyData.reduce((worst, current) => current.totalIncome < worst.totalIncome && current.totalIncome > 0 ? current : worst, monthlyData[0]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>📊 Reportes Financieros</h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>
          Análisis detallado de ingresos por mes y día para planificación financiera
        </p>
      </div>

      {/* View Mode Toggle */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <button
          className="btn-primary"
          onClick={() => setViewMode("year")}
          style={{
            background: viewMode === "year" ? "#3b82f6" : "#1e293b",
            color: "#fff",
            border: "1px solid #334155",
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            minWidth: 120,
          }}
        >
          📅 Vista Anual
        </button>
        <button
          className="btn-primary"
          onClick={() => setViewMode("month")}
          style={{
            background: viewMode === "month" ? "#3b82f6" : "#1e293b",
            color: "#fff",
            border: "1px solid #334155",
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            minWidth: 120,
          }}
        >
          📆 Vista Mensual
        </button>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: 16,
        marginBottom: 24
      }}>
        <div style={{
          background: "linear-gradient(135deg, #065f46, #059669)",
          borderRadius: 12,
          padding: "20px",
          color: "white"
        }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>
            {viewMode === "year" ? "INGRESOS TOTALES DEL AÑO" : "INGRESOS DEL MES"}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>
            ${(viewMode === "year" ? yearlyTotal : monthlyTotal).toLocaleString("es-AR")}
          </div>
          <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
            {viewMode === "year" ? selectedYear : `${selectedMonth.toString().padStart(2, '0')}/${selectedYear}`}
          </div>
        </div>

        {viewMode === "year" && (
          <>
            <div style={{
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              borderRadius: 12,
              padding: "20px",
              color: "white"
            }}>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>MEJOR MES</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>
                ${bestMonth.totalIncome.toLocaleString("es-AR")}
              </div>
              <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>
                {bestMonth.month} ({bestMonth.paymentCount} pagos)
              </div>
            </div>

            <div style={{
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              borderRadius: 12,
              padding: "20px",
              color: "white"
            }}>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>MENOS INGRESOS</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>
                ${worstMonth.totalIncome.toLocaleString("es-AR")}
              </div>
              <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>
                {worstMonth.month} ({worstMonth.paymentCount} pagos)
              </div>
            </div>
          </>
        )}

        {viewMode === "month" && (
          <div style={{
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            borderRadius: 12,
            padding: "20px",
            color: "white"
          }}>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>CANTIDAD DE PAGOS</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>
              {monthlyPaymentCount}
            </div>
            <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>
              en {selectedMonth.toString().padStart(2, '0')}/{selectedYear}
            </div>
          </div>
        )}
      </div>

      {/* Filter Controls */}
      <div style={{
        background: "#1e293b",
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
        display: "flex",
        gap: 16,
        alignItems: "center",
        flexWrap: "wrap"
      }}>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
            Año
          </label>
          <select
            className="form-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{ minWidth: 120 }}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {viewMode === "month" && (
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
              Mes
            </label>
            <select
              className="form-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              style={{ minWidth: 150 }}
            >
              {monthlyData.map((m) => (
                <option key={m.monthNumber} value={m.monthNumber}>
                  {m.month}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Monthly Breakdown Table */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: "#f1f5f9" }}>
          {viewMode === "year" ? `Ingresos por Mes - ${selectedYear}` : `Ingresos por Día - ${selectedMonth.toString().padStart(2, '0')}/${selectedYear}`}
        </h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{viewMode === "year" ? "Mes" : "Día"}</th>
                <th>Cantidad de Pagos</th>
                <th>Total Ingresos</th>
                <th>Promedio por Pago</th>
              </tr>
            </thead>
            <tbody>
              {viewMode === "year" ? (
                monthlyData.map((data) => (
                  <tr key={data.monthNumber}>
                    <td style={{ fontWeight: 600 }}>{data.month}</td>
                    <td>{data.paymentCount}</td>
                    <td style={{ fontWeight: 600, color: data.totalIncome > 0 ? "#4ade80" : "#94a3b8" }}>
                      ${data.totalIncome.toLocaleString("es-AR")}
                    </td>
                    <td style={{ color: "#94a3b8" }}>
                      {data.paymentCount > 0 ? `$${(data.totalIncome / data.paymentCount).toLocaleString("es-AR")}` : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                dailyData.map((data) => (
                  <tr key={data.day}>
                    <td style={{ fontWeight: 600 }}>{data.day}</td>
                    <td>{data.payments}</td>
                    <td style={{ fontWeight: 600, color: data.income > 0 ? "#4ade80" : "#94a3b8" }}>
                      ${data.income.toLocaleString("es-AR")}
                    </td>
                    <td style={{ color: "#94a3b8" }}>
                      {data.payments > 0 ? `$${(data.income / data.payments).toLocaleString("es-AR")}` : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Summary */}
      <div className="card">
        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: "#f1f5f9" }}>
          Resumen {viewMode === "year" ? "Mensual" : "Diario"}
        </h3>
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          height: 200,
          padding: "20px 0",
          overflowX: "auto"
        }}>
          {viewMode === "year" ? (
            monthlyData.map((data) => {
              const maxValue = Math.max(...monthlyData.map(m => m.totalIncome));
              const heightPercentage = maxValue > 0 ? (data.totalIncome / maxValue) * 100 : 0;

              return (
                <div
                  key={data.monthNumber}
                  style={{
                    flex: 1,
                    minWidth: 60,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <div style={{
                    width: "100%",
                    height: `${Math.max(heightPercentage, 2)}%`,
                    background: data.totalIncome > 0
                      ? "linear-gradient(180deg, #4ade80, #22c55e)"
                      : "#334155",
                    borderRadius: "4px 4px 0 0",
                    minHeight: 4,
                    transition: "all 0.3s ease"
                  }} />
                  <div style={{
                    fontSize: 11,
                    color: "#94a3b8",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "100%"
                  }}>
                    {data.month.slice(0, 3)}
                  </div>
                </div>
              );
            })
          ) : (
            dailyData.map((data) => {
              const maxValue = Math.max(...dailyData.map(d => d.income));
              const heightPercentage = maxValue > 0 ? (data.income / maxValue) * 100 : 0;

              return (
                <div
                  key={data.day}
                  style={{
                    flex: 1,
                    minWidth: 30,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <div style={{
                    width: "100%",
                    height: `${Math.max(heightPercentage, 2)}%`,
                    background: data.income > 0
                      ? "linear-gradient(180deg, #4ade80, #22c55e)"
                      : "#334155",
                    borderRadius: "4px 4px 0 0",
                    minHeight: 4,
                    transition: "all 0.3s ease"
                  }} />
                  <div style={{
                    fontSize: 11,
                    color: "#94a3b8",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "100%"
                  }}>
                     Día {data.day}
                   </div>
                 </div>
               );
             })
           )}
         </div>
       </div>
     </div>
   );
 }
