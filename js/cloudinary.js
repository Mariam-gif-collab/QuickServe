const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/nonio1kh/image/upload";
const UPLOAD_PRESET = "service-app-preset";

export async function uploadImage(fileInput) {
  const file = fileInput.files[0];
  if (!file) return null;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
  const data = await response.json();
  return data.secure_url;
}