import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { imagePreviewHandler$, MDXEditor, MDXEditorMethods } from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import {
  UndoRedo, BoldItalicUnderlineToggles, toolbarPlugin,
  CreateLink, linkPlugin, linkDialogPlugin, ListsToggle,
  listsPlugin, InsertImage, imagePlugin, InsertTable, tablePlugin
} from '@mdxeditor/editor';
import TurndownService from 'turndown';


const imageUploadHandler = async (image: File) => {
  const formData = new FormData();
  formData.append('image', image);

  const response = await fetch('http://cm.aggflow.com/cm/servlet/SaveWebpartImagesServlet', {
    method: 'POST',
    body: formData,
  });
  const json = (await response.json()) as { location: string };
  return json.location;
};

const convertHtmlToMdx = (html: string): string => {
  const turndownService = new TurndownService();
  const markdown = turndownService.turndown(html);
  return markdown;
};

function Editor() {
  const { id } = useParams<{ id: string }>();
  const ref = useRef<MDXEditorMethods>(null);

  useEffect(() => {
    const fetchHtmlContent = async () => {
      try {
        const response = await fetch(`http://cm.aggflow.com/cm/servlet/GetWebpartMdxServlet?id=${id}`);
        if (response.ok) {
            const task_data:{[key:string]:any} = await response.json();
            if(task_data['html'] !== undefined){
                const convertedMarkdown = convertHtmlToMdx(task_data['html']);
                ref.current?.setMarkdown(convertedMarkdown);
            }
            else if(task_data['mdx']!==undefined){
                ref.current?.setMarkdown(task_data['mdx']);
            }
        } else {
          console.error('Failed to fetch HTML content:', response.status);
        }
      } catch (error) {
        console.error('Error fetching HTML content:', error);
      }
    };
    fetchHtmlContent();
  }, [id]);

  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      if (event.clipboardData) {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") === 0) {
            const imageFile = items[i].getAsFile();
            if (imageFile) {
              event.preventDefault(); // Prevent default paste behavior
              console.log("Image detected in clipboard:", imageFile);
  
              // Upload the image and get the URL
              const imageUrl = await imageUploadHandler(imageFile);
              if (imageUrl) {
                const existingMarkdown = ref.current?.getMarkdown() || "";
                const newMarkdown = `${existingMarkdown}\n\n![Pasted Image](${imageUrl})`;
                ref.current?.setMarkdown(newMarkdown); // Update editor content
              }
            }
          }
        }
      }
    };
  
    // Attach `paste` event listener to the document
    document.addEventListener("paste", handlePaste);
  
    // Cleanup event listener
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, []);

  const sendData = async () => {
    try {
      const response = await fetch('http://cm.aggflow.com/cm/servlet/UpdateWebpartMdxServlet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: jsonToUrlEncoded({
          id: id,
          text: ref.current?.getMarkdown(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Data sent successfully:', result);
      } else {
        console.error('Error sending data:', response.statusText);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  function jsonToUrlEncoded(json: { [key: string]: any }) {
    return Object.keys(json)
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(json[key])}`)
      .join('&');
  }

  return (
    <>
      <MDXEditor
        markdown=""
        ref={ref}
        plugins={[
          linkPlugin(),
          listsPlugin(),
          imagePlugin({ imageUploadHandler }),
          linkDialogPlugin(),
          tablePlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <BoldItalicUnderlineToggles />
                <CreateLink />
                <ListsToggle />
                <InsertImage />
                <InsertTable />
                <button onClick={sendData}>Save</button>
              </>
            ),
          }),
        ]}
      />
    </>
  );
}

export default Editor;

