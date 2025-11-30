// GEMINI SERVICE DISABLED
// The previous code used process.env which is not available in browser.
// Keeping file for structure but disabling logic.

export const editStudentImage = async (
  imageBase64: string,
  prompt: string
): Promise<string> => {
  throw new Error("AI features are currently disabled.");
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};