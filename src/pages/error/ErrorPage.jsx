// components/RouteError.tsx
import { useRouteError } from 'react-router-dom';

export default function RouteError() {
  const err = useRouteError();

  return (
    <main style={{ padding: 32 }}>
      <h1 className='m-2 text-xl'>😕 Oops! Error Occured</h1>
      <p className='m-2'>Take Screenshot and Send to me. Please Remember the previous operation</p>
      <pre className='bg-gray-500 p-4 text-gray-500'>{err?.message ?? 'Something went wrong.'}</pre>
      <button  className='p-3 bg-red-500 mt-5 rounded font-bold text-white' onClick={() => window.location.reload()}>Reload Page</button>
    </main>
  );
}
