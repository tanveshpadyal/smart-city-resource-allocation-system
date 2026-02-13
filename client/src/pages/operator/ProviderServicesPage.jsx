/**
 * Provider Services Page - Operator
 */

import { useEffect, useState } from "react";
import { OperatorLayout } from "../../components/layouts/OperatorLayout";
import { Input, Select, Button } from "../../components/common";
import { ErrorAlert, SuccessAlert } from "../../components/common/Alert";
import useProvider from "../../hooks/useProvider";
import config from "../../config";

export const ProviderServicesPage = () => {
  const {
    loading,
    error,
    clearError,
    getMyProvider,
    createMyProvider,
    addMyService,
    getCatalog,
  } = useProvider();

  const [provider, setProvider] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [success, setSuccess] = useState("");

  const [providerForm, setProviderForm] = useState({
    name: "",
    city: config.cities?.[0]?.value || "",
    phone: "",
    email: "",
    address: "",
  });

  const [serviceForm, setServiceForm] = useState({
    serviceId: "",
    capacityTotal: "",
    capacityAvailable: "",
    pricePerUnit: "",
  });

  const loadData = async () => {
    const providerRes = await getMyProvider();
    setProvider(providerRes.data);
    const catalogRes = await getCatalog();
    setCatalog(catalogRes.data || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProvider = async (e) => {
    e.preventDefault();
    clearError();
    const result = await createMyProvider(providerForm);
    setProvider(result.data);
    setSuccess("Provider profile created");
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    clearError();
    await addMyService({
      serviceId: serviceForm.serviceId,
      capacityTotal: Number(serviceForm.capacityTotal),
      capacityAvailable: serviceForm.capacityAvailable
        ? Number(serviceForm.capacityAvailable)
        : undefined,
      pricePerUnit: serviceForm.pricePerUnit
        ? Number(serviceForm.pricePerUnit)
        : undefined,
    });
    setServiceForm({
      serviceId: "",
      capacityTotal: "",
      capacityAvailable: "",
      pricePerUnit: "",
    });
    await loadData();
    setSuccess("Service added to your provider");
  };

  return (
    <OperatorLayout>
      <div className="space-y-6">
        {error && <ErrorAlert message={error} onClose={clearError} />}
        {success && (
          <SuccessAlert message={success} onClose={() => setSuccess("")} />
        )}

        {!provider && (
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">
              Create Provider Profile
            </h2>
            <form
              onSubmit={handleCreateProvider}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <Input
                label="Provider Name"
                value={providerForm.name}
                onChange={(e) =>
                  setProviderForm({ ...providerForm, name: e.target.value })
                }
                required
              />
              <Select
                label="City"
                options={config.cities}
                value={providerForm.city}
                onChange={(e) =>
                  setProviderForm({ ...providerForm, city: e.target.value })
                }
                placeholder="Select city"
                required
              />
              <Input
                label="Phone"
                value={providerForm.phone}
                onChange={(e) =>
                  setProviderForm({ ...providerForm, phone: e.target.value })
                }
              />
              <Input
                label="Email"
                type="email"
                value={providerForm.email}
                onChange={(e) =>
                  setProviderForm({ ...providerForm, email: e.target.value })
                }
              />
              <Input
                label="Address"
                value={providerForm.address}
                onChange={(e) =>
                  setProviderForm({ ...providerForm, address: e.target.value })
                }
              />
              <div className="md:col-span-2">
                <Button type="submit" variant="primary" loading={loading}>
                  Create Provider
                </Button>
              </div>
            </form>
          </div>
        )}

        {provider && (
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">
              Your Provider
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-neutral-600">Name</p>
                <p className="font-medium text-neutral-900">{provider.name}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-600">City</p>
                <p className="font-medium text-neutral-900">{provider.city}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-600">Phone</p>
                <p className="font-medium text-neutral-900">
                  {provider.phone || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600">Email</p>
                <p className="font-medium text-neutral-900">
                  {provider.email || "-"}
                </p>
              </div>
            </div>
          </div>
        )}

        {provider && (
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">
              Add Service
            </h2>
            <form
              onSubmit={handleAddService}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <Select
                label="Service"
                options={catalog.map((item) => ({
                  value: item.id,
                  label: `${item.name} (${item.category})`,
                }))}
                value={serviceForm.serviceId}
                onChange={(e) =>
                  setServiceForm({ ...serviceForm, serviceId: e.target.value })
                }
                required
              />
              <Input
                label="Total Capacity"
                type="number"
                value={serviceForm.capacityTotal}
                onChange={(e) =>
                  setServiceForm({
                    ...serviceForm,
                    capacityTotal: e.target.value,
                  })
                }
                required
              />
              <Input
                label="Available Capacity"
                type="number"
                value={serviceForm.capacityAvailable}
                onChange={(e) =>
                  setServiceForm({
                    ...serviceForm,
                    capacityAvailable: e.target.value,
                  })
                }
              />
              <Input
                label="Price Per Unit"
                type="number"
                value={serviceForm.pricePerUnit}
                onChange={(e) =>
                  setServiceForm({
                    ...serviceForm,
                    pricePerUnit: e.target.value,
                  })
                }
              />
              <div className="md:col-span-2">
                <Button type="submit" variant="primary" loading={loading}>
                  Add Service
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </OperatorLayout>
  );
};

export default ProviderServicesPage;
