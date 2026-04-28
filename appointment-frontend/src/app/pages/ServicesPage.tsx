import { useEffect, useState } from "react";
import { Clock, DollarSign } from "lucide-react";
import { apiFetch } from "../../lib/api";

type ServiceItem = {
  id: number;
  name: string;
  durationMinutes: number;
  price: number;
};

export function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await apiFetch("/api/Services");
        const data = await response.json();
        setServices(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load services.");
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-lg mb-6 p-6">
        <h3 className="font-bold text-xl text-slate-900 mb-2">Service Catalog</h3>
        <p className="text-gray-600">
          Manage your business services, pricing, and duration settings.
        </p>
      </div>

      {loading && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-gray-600">
          Loading services...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700 mb-6">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors"
            >
              <h4 className="font-bold text-lg text-slate-900 mb-4">{service.name}</h4>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="p-2 bg-blue-50 rounded">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="font-mono font-medium">{service.durationMinutes} min</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-600">
                  <div className="p-2 bg-green-50 rounded">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="font-mono font-medium text-slate-900">${service.price}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}