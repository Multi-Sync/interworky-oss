'use client';

import InfoLabel from '@/app/components/InfoTooltip';
import { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { BeatLoader } from 'react-spinners';
import { Button } from '../../ui/Button';

export default function FileManager({ assistantId }) {
  const [files, setFiles] = useState([]);
  const [fileDetails, setFileDetails] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');
  // Ref for file input field
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE_MB = 150;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const ALLOWED_EXTENSIONS = ['txt', 'jsonl', 'json', 'csv', 'md', 'log', 'xml', 'pdf'];

  const fetchFileDetails = useCallback(async fileId => {
    try {
      const response = await fetch(`/api/files/details?fileId=${fileId}`);
      const data = await response.json();
      if (response.ok) {
        setFileDetails(prev => ({ ...prev, [fileId]: data.filename }));
      }
    } catch (err) {
      toast.error('Error fetching file details');
      console.error('Error fetching file details:', err);
    }
  }, []);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/files?assistantId=${assistantId}`);
      const data = await response.json();
      if (response.ok) {
        setFiles(data.data || []); // Ensure files is an array
        data.data.forEach(file => fetchFileDetails(file.id)); // Fetch filenames if files exist
      } else {
        setError(data.error || 'Failed to fetch files');
      }
    } catch (err) {
      setError('An error occurred while fetching files');
    } finally {
      setLoading(false);
    }
  }, [assistantId, fetchFileDetails]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileSelection = e => {
    const file = e.target.files[0];
    if (!file) return;

    // Get file extension
    const fileExtension = file.name.split('.').pop().toLowerCase();

    // Validate file type
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      toast.error('File type is not allowed');
      console.error(`FILE TYPE NOT ALLOWED. ONLY ALLOWED FILES ARE: ${ALLOWED_EXTENSIONS.join(', ')}`);
      setError(`Invalid file type. Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`File size must be less than ${MAX_FILE_SIZE_MB}MB Limit`);
      console.error(`FILE SIZE EXCEEDS ${MAX_FILE_SIZE_MB}MB LIMIT`);
      setError(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
      return;
    }

    // If valid, set the file for upload
    setError('');
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('assistantId', assistantId);
      formData.append('file', selectedFile);

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        fetchFiles();
        toast.success('File uploaded successfully');

        // Clear the file input field
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset file input
        }

        setSelectedFile(null); // Reset state
      } else {
        setError(data.error || 'Failed to upload file');
      }
    } catch (err) {
      setError('An error occurred during file upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (vectorStoreId, fileId) => {
    setUploading(true);
    setError('');
    try {
      const response = await fetch(`/api/files/delete?vectorStoreId=${vectorStoreId}&fileId=${fileId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (response.ok) {
        fetchFiles(); // Refresh the file list
        toast.success('File deleted successfully');
      } else {
        setError(data.error || 'Failed to delete file');
      }
    } catch (err) {
      setError('An error occurred while deleting the file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="mt-4 flex lg:flex-row flex-col md:justify-between lg:items-center items-start gap-8 p-2"
      id="file-manager"
    >
      <div className="flex gap-3 whitespace-nowrap">
        <InfoLabel label="Agent Knowledge Files" tooltipText="Knowledge Files used to guide your AI Agent responses" />

        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M20.092 14.326L20.285 12.432C20.388 11.421 20.455 10.754 20.402 10.333H20.422C21.293 10.333 22 9.587 22 8.667C22 7.747 21.293 7 20.421 7C19.549 7 18.842 7.746 18.842 8.667C18.842 9.083 18.987 9.464 19.226 9.756C18.883 9.979 18.434 10.451 17.758 11.161C17.238 11.708 16.978 11.981 16.688 12.024C16.5269 12.047 16.3626 12.0227 16.215 11.954C15.947 11.83 15.768 11.492 15.411 10.815L13.527 7.25C13.307 6.833 13.122 6.484 12.955 6.203C13.638 5.835 14.105 5.086 14.105 4.223C14.105 2.994 13.163 2 12 2C10.837 2 9.895 2.995 9.895 4.222C9.895 5.086 10.362 5.835 11.045 6.202C10.878 6.484 10.694 6.833 10.473 7.25L8.59 10.816C8.232 11.492 8.053 11.83 7.785 11.955C7.63744 12.0237 7.47312 12.048 7.312 12.025C7.022 11.982 6.762 11.708 6.242 11.161C5.566 10.451 5.117 9.979 4.774 9.756C5.014 9.464 5.158 9.083 5.158 8.666C5.158 7.747 4.45 7 3.578 7C2.708 7 2 7.746 2 8.667C2 9.587 2.707 10.333 3.579 10.333H3.598C3.544 10.753 3.612 11.421 3.715 12.432L3.908 14.326C4.015 15.377 4.104 16.377 4.214 17.278H19.786C19.896 16.378 19.985 15.377 20.092 14.326ZM10.855 22H13.145C16.13 22 17.623 22 18.619 21.06C19.053 20.648 19.329 19.908 19.527 18.944H4.473C4.671 19.908 4.946 20.648 5.381 21.059C6.377 22 7.87 22 10.855 22Z"
            fill="#F3AA0C"
          />
        </svg>
      </div>

      <div className="w-full md:w-full lg:w-[700px]">
        {/* Error Message */}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* File Upload */}
        <div className="p-4 space-y-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <input
              type="file"
              ref={fileInputRef} // Assign ref to input
              onChange={handleFileSelection}
              className="border border-gray-300 rounded-md px-3 py-2 w-full flex-grow text-body font-medium"
            />
            <Button onClick={handleUpload} isLoading={uploading} disabled={!selectedFile} intent={'secondary'}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                <g
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  color="currentColor"
                >
                  <path d="M12.5 2h.273c3.26 0 4.892 0 6.024.798c.324.228.612.5.855.805c.848 1.066.848 2.6.848 5.67v2.545c0 2.963 0 4.445-.469 5.628c-.754 1.903-2.348 3.403-4.37 4.113c-1.257.441-2.83.441-5.98.441c-1.798 0-2.698 0-3.416-.252c-1.155-.406-2.066-1.263-2.497-2.35c-.268-.676-.268-1.523-.268-3.216V12" />
                  <path d="M20.5 12a3.333 3.333 0 0 1-3.333 3.333c-.666 0-1.451-.116-2.098.057a1.67 1.67 0 0 0-1.179 1.179c-.173.647-.057 1.432-.057 2.098A3.333 3.333 0 0 1 10.5 22m-6-17.5C4.992 3.994 6.3 2 7 2m2.5 2.5C9.008 3.994 7.7 2 7 2m0 0v8" />
                </g>
              </svg>
            </Button>
          </div>
        </div>

        {/* File List */}
        {loading ? (
          <div className="w-full py-5 flex items-center justify-center">
            <BeatLoader size={24} color="#058A7C" />
          </div>
        ) : files.length === 0 ? (
          <p className="text-tertiary mt-4 text-body">No files uploaded yet.</p>
        ) : (
          <div className="p-4 space-y-4 bg-white rounded-lg border border-gray-200 shadow-sm mt-4">
            <div className="grid grid-cols-3 mb-2 text-body text-secondary-light">
              <div className="text-start font-medium">File Name</div>
            </div>
            {files.map(file => (
              <div key={file.id} className="flex items-center gap-4 p-2 border border-gray-200 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                  <g fill="none">
                    <path
                      fill="#058A7C"
                      d="m15.393 4.054l-.502.557zm3.959 3.563l-.502.557zm2.302 2.537l-.685.305zM3.172 20.828l.53-.53zm17.656 0l-.53-.53zM14 21.25h-4v1.5h4zM2.75 14v-4h-1.5v4zm18.5-.437V14h1.5v-.437zM14.891 4.61l3.959 3.563l1.003-1.115l-3.958-3.563zm7.859 8.952c0-1.689.015-2.758-.41-3.714l-1.371.61c.266.598.281 1.283.281 3.104zm-3.9-5.389c1.353 1.218 1.853 1.688 2.119 2.285l1.37-.61c-.426-.957-1.23-1.66-2.486-2.79zM10.03 2.75c1.582 0 2.179.012 2.71.216l.538-1.4c-.852-.328-1.78-.316-3.248-.316zm5.865.746c-1.086-.977-1.765-1.604-2.617-1.93l-.537 1.4c.532.204.98.592 2.15 1.645zM10 21.25c-1.907 0-3.261-.002-4.29-.14c-1.005-.135-1.585-.389-2.008-.812l-1.06 1.06c.748.75 1.697 1.081 2.869 1.239c1.15.155 2.625.153 4.489.153zM1.25 14c0 1.864-.002 3.338.153 4.489c.158 1.172.49 2.121 1.238 2.87l1.06-1.06c-.422-.424-.676-1.004-.811-2.01c-.138-1.027-.14-2.382-.14-4.289zM14 22.75c1.864 0 3.338.002 4.489-.153c1.172-.158 2.121-.49 2.87-1.238l-1.06-1.06c-.424.422-1.004.676-2.01.811c-1.027.138-2.382.14-4.289.14zM21.25 14c0 1.907-.002 3.262-.14 4.29c-.135 1.005-.389 1.585-.812 2.008l1.06 1.06c.75-.748 1.081-1.697 1.239-2.869c.155-1.15.153-2.625.153-4.489zm-18.5-4c0-1.907.002-3.261.14-4.29c.135-1.005.389-1.585.812-2.008l-1.06-1.06c-.75.748-1.081 1.697-1.239 2.869C1.248 6.661 1.25 8.136 1.25 10zm7.28-8.75c-1.875 0-3.356-.002-4.511.153c-1.177.158-2.129.49-2.878 1.238l1.06 1.06c.424-.422 1.005-.676 2.017-.811c1.033-.138 2.395-.14 4.312-.14z"
                    />
                    <path stroke="#058A7C" strokeWidth="2" d="M13 2.5V5c0 2.357 0 3.536.732 4.268S15.643 10 18 10h4" />
                  </g>
                </svg>
                <div className="flex-1">
                  <span className="text-secondary text-body">
                    {fileDetails[file.id] || <BeatLoader color="#058A7C" />}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(file.vector_store_id, file.id)}
                  className="text-white px-4 py-2 rounded-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                      fill="none"
                      stroke="#EF4444"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m18 9l-.84 8.398c-.127 1.273-.19 1.909-.48 2.39a2.5 2.5 0 0 1-1.075.973C15.098 21 14.46 21 13.18 21h-2.36c-1.279 0-1.918 0-2.425-.24a2.5 2.5 0 0 1-1.076-.973c-.288-.48-.352-1.116-.48-2.389L6 9m7.5 6.5v-5m-3 5v-5m-6-4h4.615m0 0l.386-2.672c.112-.486.516-.828.98-.828h3.038c.464 0 .867.342.98.828l.386 2.672m-5.77 0h5.77m0 0H19.5"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
