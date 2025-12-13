/**
 * Example route demonstrating @kreator/data usage
 * This is a test route to verify TypeORM integration
 */
import type { Route } from "./+types/db-test";
import { initializeDatabase, User, Address } from "@kreator/data";

export async function loader({ request }: Route.LoaderArgs) {
  const db = await initializeDatabase();

  // Get user count
  const userCount = await User.count();

  // Get all users with addresses
  const users = await User.find({
    relations: ["addresses"],
    order: { createdAt: "DESC" },
    take: 10,
  });

  return {
    dbType: process.env.DB_TYPE || "sqlite",
    userCount,
    users,
    message: "Database connection successful!",
  };
}

export async function action({ request }: Route.ActionArgs) {
  await initializeDatabase();

  const formData = await request.formData();
  const actionType = formData.get("_action");

  if (actionType === "createUser") {
    const user = User.create({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      status: "active",
    });
    await user.save();

    return { success: true, user };
  }

  if (actionType === "createAddress") {
    const address = Address.create({
      userId: formData.get("userId") as string,
      label: formData.get("label") as string,
      street: formData.get("street") as string,
      city: formData.get("city") as string,
      country: formData.get("country") as string,
    });
    await address.save();

    return { success: true, address };
  }

  return { error: "Unknown action" };
}

export default function DbTestPage({ loaderData }: Route.ComponentProps) {
  const { dbType, userCount, users, message } = loaderData;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Database Test</h1>

      <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg mb-6">
        <p className="text-green-800 dark:text-green-200">✓ {message}</p>
        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
          Database Type: <strong>{dbType}</strong>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Create User Form */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Create User</h2>
          <form method="post" className="space-y-3">
            <input type="hidden" name="_action" value="createUser" />
            <input type="text" name="name" placeholder="Name" required className="w-full px-3 py-2 border rounded" />
            <input type="email" name="email" placeholder="Email" required className="w-full px-3 py-2 border rounded" />
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
              Create User
            </button>
          </form>
        </div>

        {/* Stats */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Stats</h2>
          <p className="text-4xl font-bold">{userCount}</p>
          <p className="text-gray-500">Total Users</p>
        </div>
      </div>

      {/* Users List */}
      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Users</h2>
        {users.length === 0 ? (
          <p className="text-gray-500">No users yet. Create one above!</p>
        ) : (
          <ul className="space-y-2">
            {users.map((user) => (
              <li key={user.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                {" "}
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <p className="text-xs text-gray-400">{user.addresses?.length || 0} addresses</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
