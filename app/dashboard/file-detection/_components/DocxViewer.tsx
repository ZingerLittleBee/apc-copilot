"use client";

import { useEffect, useRef } from "react";
import { renderAsync } from "docx-preview";

export const DocxViewer = ({ fileUrl }: { fileUrl: string }) => {
  const docxViewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!!docxViewRef.current) {
      fetch(fileUrl)
        .then((response) => {
          return response.arrayBuffer();
        })
        .then((res) => {
          //调用预览器的preview方法
          if (docxViewRef.current) {
            renderAsync(res, docxViewRef.current);
          }
        });
    }
  }, [docxViewRef.current]);

  return (
    <>
      <div id="docx-view" className="h-full relative overflow-auto" ref={docxViewRef}></div>
    </>
  );
};
