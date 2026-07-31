
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

const CreateWorkoutPage = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-6">Create Custom Workout</h1>
      <div className="bg-card p-6 rounded-lg shadow-lg">
        <p>Workout creation interface will be here.</p>
        <Link href="/dashboard">
          <button className="mt-4 inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            <PlusCircle className="mr-2 h-4 w-4" />
            Back to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
};

export default CreateWorkoutPage;
