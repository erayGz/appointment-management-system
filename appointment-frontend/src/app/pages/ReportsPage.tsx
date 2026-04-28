import { useEffect, useMemo, useState } from "react";
import { TrendingUp, DollarSign, Users, Calendar } from "lucide-react";
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
  createdAt: string;
};

type ServiceItem = {
  id: number;
  name: string;
  durationMinutes: number;
  price: number;
};

export function ReportsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [appointmentsRes, customersRes, servicesRes] = await Promise.all([
        apiFetch("/api/Appointments"),
        apiFetch("/api/Customer"),
        apiFetch("/api/Services"),
      ]);

      const [appointmentsData, customersData, servicesData] = await Promise.all([
        appointmentsRes.json(),
        customersRes.json(),
        servicesRes.json(),
      ]);

      setAppointments(appointmentsData);
      setCustomers(customersData);
      setServices(servicesData);
    } catch (err) {
      console.error(err);
      setError("Failed to load reports data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const servicePriceMap = useMemo(() => {
    const map = new Map<number, number>();
    services.forEach((service) => {
      map.set(service.id, service.price);
    });
    return map;
  }, [services]);

  const totalRevenue = useMemo(() => {
    return appointments
      .filter((a) => a.status === 3)
      .reduce((sum, apt) => sum + (servicePriceMap.get(apt.serviceItemId) ?? 0), 0);
  }, [appointments, servicePriceMap]);

  const completedCount = appointments.filter((a) => a.status === 3).length;

  const thisMonthCustomers = useMemo(() => {
    const now = new Date();
    return customers.filter((customer) => {
      const created = new Date(customer.createdAt);
      return (
        created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth()
      );
    }).length;
  }, [customers]);

  const completionRate = appointments.length
    ? ((completedCount / appointments.length) * 100).toFixed(1)
    : "0.0";

  const monthlyStats = [
    {
      label: "Total Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      change: "Live",
      icon: DollarSign,
    },
    {
      label: "New Customers",
      value: String(thisMonthCustomers),
      change: "This month",
      icon: Users,
    },
    {
      label: "Appointments Completed",
      value: String(completedCount),
      change: "Live",
      icon: Calendar,
    },
    {
      label: "Completion Rate",
      value: `${completionRate}%`,
      change: "Live",
      icon: TrendingUp,
    },
  ];

  const topServices = useMemo(() => {
    const counts = new Map<number, { name: string; bookings: number; revenue: number }>();

    appointments.forEach((apt) => {
      const existing = counts.get(apt.serviceItemId);
      const price = servicePriceMap.get(apt.serviceItemId) ?? 0;

      if (existing) {
        existing.bookings += 1;
        if (apt.status === 3) {
          existing.revenue += price;
        }
      } else {
        counts.set(apt.serviceItemId, {
          name: apt.serviceName,
          bookings: 1,
          revenue: apt.status === 3 ? price : 0,
        });
      }
    });

    return Array.from(counts.values())
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);
  }, [appointments, servicePriceMap]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-600">
        Loading reports...
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-lg mb-6 p-6">
        <h3 className="font-bold text-xl text-slate-900 mb-2">Performance Report</h3>
        <p className="text-gray-600">
          Overview of your current business metrics based on live data.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {monthlyStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-green-600 font-medium text-sm">{stat.change}</span>
              </div>
              <p className="text-gray-600 mb-1">{stat.label}</p>
              <p className="font-bold text-3xl text-slate-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-bold text-lg text-slate-900 mb-4">Top Services</h4>

        {topServices.length === 0 ? (
          <p className="text-gray-600">No service data available yet.</p>
        ) : (
          <div className="space-y-4">
            {topServices.map((service, index) => (
              <div
                key={service.name}
                className="flex items-center justify-between pb-4 border-b border-gray-200 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-gray-500 w-6">{index + 1}.</span>
                  <div>
                    <p className="font-medium text-slate-900">{service.name}</p>
                    <p className="text-sm text-gray-600">{service.bookings} bookings</p>
                  </div>
                </div>
                <p className="font-mono font-bold text-slate-900">
                  ${service.revenue.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}