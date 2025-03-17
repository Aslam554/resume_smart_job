import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [jobData, setJobData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [jobsToShow, setJobsToShow] = useState(3); // Show first 3 jobs initially

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post("http://localhost:8000/upload-resume/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResumeData(response.data.resume_data);
      setJobData(response.data.job_data);
    } catch (error) {
      console.error("Error uploading the file", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl font-bold text-purple-700 mb-6"
      >
        Smart Job Portal
      </motion.h1>

      {/* Main Container - Two Column Layout */}
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl">
        {/* Resume Upload Section (Left Side) */}
        <div className="bg-white p-6 rounded-xl shadow-lg flex-1 min-w-[300px]">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Upload Your Resume</h2>
          <input type="file" onChange={handleFileChange} className="w-full p-2 border rounded mb-4" />
          <button
            onClick={handleUpload}
            className="w-full bg-purple-700 text-white py-2 rounded hover:bg-purple-800 transition-all"
            disabled={loading}
          >
            {loading ? "Uploading..." : "Upload Resume"}
          </button>
        </div>

        {/* Resume Data Display (Right Side) */}
        {resumeData && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.5 }}
            className="bg-white p-6 rounded-xl shadow-lg flex-1"
          >
            <h2 className="text-xl font-bold text-gray-700 mb-4">Resume Data</h2>
            <table className="w-full border-collapse border border-gray-300">
              <tbody>
                {Object.entries(resumeData).map(([key, value]) => (
                  <tr key={key} className="border-b">
                    <td className="p-3 font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</td>
                    <td className="p-3">{Array.isArray(value) ? value.join(", ") : value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>

      {/* Job Cards Section */}
      {jobData.length > 0 ? (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.5 }}
          className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl"
        >
          {jobData.slice(0, jobsToShow).map((job, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.03 }}
              className="bg-white w-full rounded-lg shadow-lg p-5 border border-gray-200 flex flex-col"
            >
              {job.title.includes("NO JOBS FOUND") ? (
                <div className="text-center py-10">
                  <h2 className="text-3xl font-bold text-red-500">{job.title}</h2>
                  <p className="text-lg text-gray-600 mt-2">{job.description}</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-700 text-white w-10 h-10 flex items-center justify-center rounded-md text-lg font-bold">
                      {job.company?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{job.title}</h3>
                      <p className="text-sm text-gray-500">{job.company} • {job.location}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    {job.type && <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-600 rounded-full">{job.type}</span>}
                    {job.mode && <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-purple-700 rounded-full">{job.mode}</span>}
                  </div>

                  <div className="mt-3 flex-grow">
                    <h4 className="text-gray-700 font-semibold">About the job</h4>
                    <p className="text-sm text-gray-600">{job.description.slice(0, 100)}...</p>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="flex-1 bg-purple-700 text-white py-2 rounded-lg text-center font-medium hover:bg-purple-700 transition">
                      Apply
                    </a>
                    <button className="flex-1 border border-gray-300 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition">
                      Save
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center mt-10">
          <h2 className="text-3xl font-bold text-red-500">🚀 NO JOBS FOUND 🚀</h2>
          <p className="text-lg text-gray-600 mt-2">Sorry, no matching jobs were found. Please try updating your resume or skills.</p>
        </div>
      )}

      {/* Show More Jobs Button */}
      {jobData.length > jobsToShow && jobData.some(job => !job.title.includes("NO JOBS FOUND")) && (
        <button 
          onClick={() => setJobsToShow(jobsToShow + 3)} 
          className="mt-4 px-6 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition"
        >
          Show More Jobs
        </button>
      )}
    </div>
  );
}

export default App;
