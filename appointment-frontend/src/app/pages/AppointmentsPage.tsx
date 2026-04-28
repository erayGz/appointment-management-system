import { useEffect, useState } from "react";
import { Plus, Check, X, Edit, Clock } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
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

type ServiceItem = {
  id: number;
  name: string;
};

type FormState = {
  customerId: string;
  serviceItemId: string;
  startTime: string;
  notes: string;
  status: string;
};

const emptyForm: FormState = {
  customerId: "",
  serviceItemId: "",
  startTime: "",
  notes: "",
  status: "0",
};

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

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
      setError("Failed to load appointments data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const toDateTimeLocalValue = (datetime: string) => {
    const date = new Date(datetime);
    const pad = (n: number) => String(n).padStart(2, "0");

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const openCreateDialog = () => {
    setEditingAppointment(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setForm({
      customerId: String(appointment.customerId),
      serviceItemId: String(appointment.serviceItemId),
      startTime: toDateTimeLocalValue(appointment.startTime),
      notes: appointment.notes ?? "",
      status: String(appointment.status),
    });
    setDialogOpen(true);
  };

  const handleSaveAppointment = async () => {
    try {
      setSubmitting(true);
      setError("");

      if (!form.customerId || !form.serviceItemId || !form.startTime) {
        setError("Please fill in customer, service, and start time.");
        return;
      }

      if (editingAppointment) {
        await apiFetch(`/api/Appointments/${editingAppointment.id}`, {
          method: "PUT",
          body: JSON.stringify({
            customerId: Number(form.customerId),
            serviceItemId: Number(form.serviceItemId),
            startTime: form.startTime,
            status: Number(form.status),
            notes: form.notes,
          }),
        });
      } else {
        await apiFetch("/api/Appointments", {
          method: "POST",
          body: JSON.stringify({
            customerId: Number(form.customerId),
            serviceItemId: Number(form.serviceItemId),
            startTime: form.startTime,
            notes: form.notes,
          }),
        });
      }

      setDialogOpen(false);
      setForm(emptyForm);
      setEditingAppointment(null);
      await loadData();
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message || "Failed to save appointment.");
      } else {
        setError("Failed to save appointment.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const changeStatus = async (id: number, action: "confirm" | "cancel" | "complete") => {
    try {
      setError("");

      await apiFetch(`/api/Appointments/${id}/${action}`, {
        method: "POST",
      });

      await loadData();
    } catch (err) {
      console.error(err);
      setError("Failed to update appointment status.");
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-6">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              New Appointment
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingAppointment ? "Edit Appointment" : "Create New Appointment"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="customer">Customer</Label>
                <Select
                  value={form.customerId}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, customerId: value }))
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={String(customer.id)}>
                        {customer.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="service">Service</Label>
                <Select
                  value={form.serviceItemId}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, serviceItemId: value }))
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={String(service.id)}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  className="mt-1.5"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, startTime: e.target.value }))
                  }
                />
              </div>

              {editingAppointment && (
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Pending</SelectItem>
                      <SelectItem value="1">Confirmed</SelectItem>
                      <SelectItem value="2">Cancelled</SelectItem>
                      <SelectItem value="3">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any special notes..."
                  className="mt-1.5"
                  rows={3}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleSaveAppointment}
                disabled={submitting}
              >
                {submitting
                  ? "Saving..."
                  : editingAppointment
                  ? "Update Appointment"
                  : "Create Appointment"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-600">
          Loading appointments...
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 mb-2">No appointments scheduled</h3>
          <p className="text-gray-600">Create your first appointment to get started.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">ID</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Customer</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Service</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Start Time</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">End Time</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{apt.id}</td>
                    <td className="px-6 py-4 text-slate-900">{apt.customerName}</td>
                    <td className="px-6 py-4 text-gray-600">{apt.serviceName}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-sm">
                      {formatTime(apt.startTime)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-sm">
                      {formatTime(apt.endTime)}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(apt.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {apt.status === 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => changeStatus(apt.id, "confirm")}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}

                        {apt.status === 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => changeStatus(apt.id, "complete")}
                            className="text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}

                        {apt.status !== 2 && apt.status !== 3 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => changeStatus(apt.id, "cancel")}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(apt)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}