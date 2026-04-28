import { useEffect, useMemo, useState } from "react";
import { Users, Calendar, CheckCircle, Clock } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { apiFetch } from "../../lib/api";

type Appointment = {
  id: number;
  customerId: number;
  customerName: string;
  serviceItemId: number;
  serviceName: string;
  startTime: string;
  endTime: string;
  status: number;
  notes: string | null;
};

type Customer = {
  id: number;
  fullName: string;
};

export function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [appointmentsRes, customersRes] = await Promise.all([
        apiFetch("/api/Appointments"),
        apiFetch("/api/Customer"),
      ]);

      const [appointmentsData, customersData] = await Promise.all([
        appointmentsRes.json(),
        customersRes.json(),
      ]);

      setAppointments(appointmentsData);
      setCustomers(customersData);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const todayAppointments = useMemo(
    () => appointments.filter((a) => isToday(a.startTime)),
    [appointments]
  );

  const stats = useMemo(() => {
    const confirmed = appointments.filter((a) => a.status === 1).length;
    const completed = appointments.filter((a) => a.status === 3).length;

    return [
      {
        label: "Total Customers",
        value: String(customers.length),
        icon: Users,
        color: "bg-blue-50 text-blue-600",
      },
      {
        label: "Today's Appointments",
        value: String(todayAppointments.length),
        icon: Calendar,
        color: "bg-purple-50 text-purple-600",
      },
      {
        label: "Confirmed",
        value: String(confirmed),
        icon: CheckCircle,
        color: "bg-green-50 text-green-600",
      },
      {
        label: "Completed",
        value: String(completed),
        icon: Clock,
        color: "bg-slate-50 text-slate-600",
      },
    ];
  }, [appointments, customers.length, todayAppointments.length]);

  const getStatusBadge = (status: number) => {
    const variants: Record<number, string> = {
      0: "bg-gray-100 text-gray-700 hover:bg-gray-100 font-mono",
      1: "bg-green-100 text-green-700 hover:bg-green-100 font-mono",
      2: "bg-red-100 text-red-700 hover:bg-red-100 font-mono",
      3: "bg-slate-100 text-slate-700 hover:bg-slate-100 font-mono",
    };

    const labels: Record<number, string> = {
      0: "PENDING",
      1: "CONFIRMED",
      2: "CANCELLED",
      3: "COMPLETED",
    };

    return <Badge className={variants[status] ?? variants[0]}>{labels[status] ?? "UNKNOWN"}</Badge>;
  };

  const formatTime = (datetime: string) => {
    const date = new Date(datetime);
    return date.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-600">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h3 className="font-bold text-xl text-slate-900 mb-2">
          Manage appointments and customer records in one place.
        </h3>
        <p className="text-gray-600">
          Track your business operations efficiently with real-time updates and organized scheduling.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <p className="text-gray-600 mb-1">{stat.label}</p>
              <p className="font-bold text-3xl text-slate-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="font-bold text-lg text-slate-900">Today's Appointments</h4>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="p-8 text-gray-600">No appointments scheduled for today.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">ID</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Customer</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Service</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Time</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {todayAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{apt.id}</td>
                    <td className="px-6 py-4 text-slate-900">{apt.customerName}</td>
                    <td className="px-6 py-4 text-gray-600">{apt.serviceName}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono">{formatTime(apt.startTime)}</td>
                    <td className="px-6 py-4">{getStatusBadge(apt.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}