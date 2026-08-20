import html2canvas from 'html2canvas';

export const downloadSnapshot = async (elementId, filename) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#0F172A', // space-900 color
      scale: 2, // High resolution
      logging: false,
      useCORS: true
    });

    const image = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = image;
    link.click();
  } catch (error) {
    console.error('Failed to capture snapshot:', error);
  }
};
