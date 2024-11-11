import { LoaderFunctionArgs, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

type User = {
  id: string;
  name: string;
  role: string;
};

type LoaderData = {
  users: User[];
  error: string | null;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log(`🚀 Server-side loader executing for ${request.url}`);

  try {
    const response = await fetch(`http://localhost:3000/api/users`, {
      headers: {
        Authorization: `users API-Key 65ae96e1-fe2e-44e8-8c72-2439d90a84cd`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: { docs: User[] } = await response.json();
    console.log('Fetched result:', result);
    return json<LoaderData>({ users: result.docs, error: null });
  } catch (error) {
    console.error('Error fetching users:', error);
    return json<LoaderData>({ users: [], error: String(error) });
  }
};

export default function UsersRoute() {
  console.log('🎯 Component rendering...');
  const data = useLoaderData<typeof loader>();

  if (!data) {
    return <div>Loading...</div>;
  }

  if (data.error) {
    return <div>Error: {data.error}</div>;
  }

  return (
    <div>
      <h2>Users</h2>
      <ul>
        {data.users.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
