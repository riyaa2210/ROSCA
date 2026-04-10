import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import Spinner from "../components/Spinner";

export default function JoinGroupPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.post(`/groups/join/${code}`)
      .then(({ data }) => {
        toast.success(`Joined "${data.group.name}" successfully!`);
        navigate(`/groups/${data.group._id}`);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to join group");
        setLoading(false);
      });
  }, [code]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-gray-500">Joining group...</p>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-sm w-full text-center">
        <span className="text-5xl">❌</span>
        <h2 className="text-xl font-bold mt-4 text-gray-900 dark:text-white">Couldn't Join</h2>
        <p className="text-gray-500 mt-2">{error}</p>
        <button onClick={() => navigate("/groups")} className="btn-primary mt-6 w-full">Go to Groups</button>
      </div>
    </div>
  );
}
