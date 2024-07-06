import {ChangeEvent, FormEvent, useState} from 'react'
import reactLogo from './assets/react.svg'
import MarkdownIt from 'markdown-it'
import viteLogo from '/vite.svg'
import './App.css'
import {Content, GoogleGenerativeAI, HarmBlockThreshold, HarmCategory} from "@google/generative-ai";

function App() {
  const [file, setFile] = useState<File|null>(null);
  const [imageBase64, setImageBase64] = useState<string|null>(null);
  const API_KEY = import.meta.env.GEMINI_API_KEY as string;


  const [promptInput, setPromptInput] = useState<string>("Provide an example recipe for the baked goods in the image");
  const [output, setOutput] = useState("");

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    try{
      // Load the image as base64 string

      if(e.target.files){
        const fileInput = e.target.files[0];
        setFile(fileInput);

        const reader = new FileReader();

        reader.onload = () => {
          if(reader.result)
            setImageBase64(reader.result.toString());
        };

        reader.readAsDataURL(fileInput);
      }



    }catch (e){
      if(output)
        setOutput(output + '</hr>' + e);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();


    if(output)
      setOutput("Generating...");

    try{
      // Load the image as base64 string
      //const file: File|null =  e.target.files? e.target.files[0] : null;



      // Assemble the prompt by combining the text with the chosen image
      const contents: Content[] = [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: imageBase64 ? imageBase64 : "", } },
            { text: promptInput },
          ]
        }
      ];

      // Call the multimodal model, and get a stream of results
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash", // or gemini-1.5-pro
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
        ],
      });

      const result = await model.generateContentStream({ contents });

      // Read from the stream and interpret the output as markdown
      const buffer = [];
      const md = new MarkdownIt();
      for await (const response of result.stream) {
        buffer.push(response.text());


      }
      setOutput( md.render(buffer.join('')));



    }catch(e){
      if(output)
        setOutput(output + '</hr>' + e);
    }


  }

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <div className="card">
        <form method="POST" onSubmit={handleSubmit}>
          <div className="image-picker">
            <input type="file"
                   id="fileInput"
                   name="file"
                   accept="image/jpeg, image/png, image/jpg"
              //value={preview}
                   onChange={(e) => onChange(e)}
            />
          </div>
          <div className="prompt-box">
            <label>
              <input name="prompt"
                     placeholder="Enter instructions here"
                     type="text"
                     value={promptInput}
                     onChange={(e) => setPromptInput(e.target.value)}
              />

            </label>
            <button type="submit">Go</button>
          </div>
          <div className="preview">
            {imageBase64 && (
              <img className="preview" src={imageBase64} alt="Upload preview"/>
            )}
          </div>
        </form>
        <p className="output">{output ? output : "Results will appear here"}</p>
      </div>
    </>
  )
}

export default App
