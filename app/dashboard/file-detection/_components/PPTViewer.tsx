"use client";

import { init } from "pptx-preview";
import { useEffect, useRef } from "react";

export const PPTViewerClient = ({ fileUrl }: { fileUrl: string }) => {
  const pptViewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pptViewRef.current) {
      // 获取pptViewRef width height
      const { width, height } = pptViewRef.current.getBoundingClientRect();
      const pptxPrviewer = init(pptViewRef.current, {
        width: width,
        height: height,
      });

      fetch(fileUrl)
        .then((response) => {
          return response.arrayBuffer();
        })
        .then((res) => {
          //调用预览器的preview方法
          pptxPrviewer.preview(res);
        });
    }
  }, [pptViewRef.current]);

  return (
    <>
      <div id="ppt-view" className="h-full relative" ref={pptViewRef}></div>
    </>
  );
};
