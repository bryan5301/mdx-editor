import React from 'react';
import ReactMarkdown from 'react-markdown';

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";


const Viewer = () => {
    const { id } = useParams<{ id: string }>(); 

    const [text, setText] = useState('');
    useEffect(() => {
      const fetchHtmlContent = async () => {
        try { 
          const response = await fetch(`http://localhost:8007/cm/servlet/GetWebpartTestServlet?id=${id}`);
          if (response.ok) {
            const mdData = await response.text();
           setText(mdData)
                } else {
            console.error('Failed to fetch HTML content:', response.status);
          }
        } catch (error) {
          console.error('Error fetching HTML content:', error);
        }
      };
  
      fetchHtmlContent();
    }, [id]); // Re-run if `id` changes
   
    return (
        <div>
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      );
}

export default Viewer;