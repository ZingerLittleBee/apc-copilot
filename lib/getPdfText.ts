import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// 设置 worker
GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// 提取文本的函数
async function extractPDFText(pdfPath:ArrayBuffer) {
  try {
    // 加载 PDF 文档
    const pdf = await getDocument(pdfPath).promise;
    
    // 获取页面数量
    const maxPages = pdf.numPages;
    const pageTextPromises = [];
    
    // 遍历每一页
    for (let pageNo = 1; pageNo <= maxPages; pageNo++) {
      // 获取页面
      const page = await pdf.getPage(pageNo);
      
      // 获取页面文本内容
      const textContent = await page.getTextContent();
      
      // 将文本内容转换为字符串
      // @ts-ignore
      const pageText = textContent.items.map(item => item.str).join(' ');
      pageTextPromises.push(pageText);
    }
    
    // 合并所有页面的文本
    const text = await Promise.all(pageTextPromises);
    return text.join('\n');
    
  } catch (error) {
    console.error('提取 PDF 文本时出错：', error);
    throw error;
  }
}

export {
    extractPDFText
}