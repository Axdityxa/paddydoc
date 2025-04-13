import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@env';
import * as FileSystem from 'expo-file-system';

// Initialize the Gemini API with your API key
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Converts a local file URI to a base64 string
 */
const fileToGenerativePart = async (uri: string): Promise<Part> => {
  try {
    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Get the mime type based on file extension
    const mimeType = uri.endsWith('.jpg') || uri.endsWith('.jpeg') 
      ? 'image/jpeg' 
      : uri.endsWith('.png') 
      ? 'image/png' 
      : 'image/jpeg'; // Default to jpeg if unknown
    
    return {
      inlineData: {
        data: base64,
        mimeType,
      },
    };
  } catch (error) {
    console.error('Error converting file to generative part:', error);
    throw error;
  }
};

/**
 * Analyzes an image for paddy disease using Gemini Pro Vision
 */
export const analyzePaddyDisease = async (imageUri: string): Promise<string> => {
  try {
    // Initialize the model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    // Prepare the image
    const imagePart = await fileToGenerativePart(imageUri);
    
    // Create the prompt
    const prompt = "Analyze this paddy (rice) plant image and identify if there are any diseases. If a disease is present, provide the following information: 1) Disease name, 2) Severity (mild, moderate, severe), 3) Brief description of symptoms, 4) Recommended treatment. If the plant appears healthy, just state that it looks healthy.";
    
    // Generate content with the image and prompt
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error('Error analyzing image with Gemini:', error);
    return `Error analyzing image: ${error.message}`;
  }
}; 