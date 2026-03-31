import 'dotenv/config';

const FIGMA_TOKEN = process.env.FIGMA_TOKEN!;
const FILE_ID = 'x0kQhyYX0fclIGMqIxRePL';

if (!FIGMA_TOKEN) {
  console.error('❌ FIGMA_TOKEN not found in .env');
  process.exit(1);
}

async function analyzeFigmaFile() {
  try {
    // Получаем полную структуру файла
    const response = await fetch(`https://api.figma.com/v1/files/${FILE_ID}?geometry=paths`, {
      headers: { 'X-Figma-Token': FIGMA_TOKEN },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ API Error:', error);
      process.exit(1);
    }

    const data = await response.json();
    
    console.log('📁 Файл:', data.name);
    console.log('='.repeat(50));

    // Рекурсивно обходим дерево
    function traverse(node: any, depth = 0) {
      const indent = '  '.repeat(depth);
      const type = node.type || 'UNKNOWN';
      const name = node.name || 'Unnamed';
      
      // Интересные типы: FRAME, COMPONENT, INSTANCE, TEXT, RECTANGLE, VECTOR
      if (['FRAME', 'COMPONENT', 'INSTANCE', 'PAGE'].includes(type)) {
        console.log(`${indent}📐 [${type}] ${name} ${node.id ? `(id: ${node.id})` : ''}`);
        
        // Для фреймов показываем размеры
        if (node.absoluteBoundingBox) {
          const { width, height } = node.absoluteBoundingBox;
          console.log(`${indent}   └─ ${Math.round(width)}×${Math.round(height)}px`);
        }
      }
      
      // Для текстовых элементов показываем стили
      if (type === 'TEXT' && node.style) {
        console.log(`${indent}📝 ${name}`);
        console.log(`${indent}   └─ ${node.style.fontFamily}, ${node.style.fontSize}px, ${node.style.fontWeight}`);
        if (node.characters) {
          const text = node.characters.slice(0, 50).replace(/\n/g, ' ');
          console.log(`${indent}   └─ "${text}${node.characters.length > 50 ? '...' : ''}"`);
        }
      }
      
      // Для прямоугольников/фонов показываем цвета
      if (type === 'RECTANGLE' || type === 'VECTOR') {
        const fills = node.fills?.filter((f: any) => f.visible !== false);
        if (fills?.length) {
          const fill = fills[0];
          if (fill.type === 'SOLID' && fill.color) {
            const { r, g, b } = fill.color;
            const hex = `#${Math.round(r * 255).toString(16).padStart(2, '0')}${Math.round(g * 255).toString(16).padStart(2, '0')}${Math.round(b * 255).toString(16).padStart(2, '0')}`;
            console.log(`${indent}⬜ ${name}: ${hex}`);
          }
        }
      }

      // Рекурсивно для детей
      if (node.children) {
        node.children.forEach((child: any) => traverse(child, depth + 1));
      }
    }

    // Начинаем обход со страницы
    data.document?.children?.forEach((page: any) => {
      console.log(`\n📄 Страница: ${page.name}`);
      console.log('-'.repeat(50));
      page.children?.forEach((child: any) => traverse(child, 1));
    });

    // Получаем стили (цвета, типографику)
    console.log('\n\n🎨 Получение стилей...');
    const stylesResponse = await fetch(`https://api.figma.com/v1/files/${FILE_ID}/styles`, {
      headers: { 'X-Figma-Token': FIGMA_TOKEN },
    });

    if (stylesResponse.ok) {
      const stylesData = await stylesResponse.json();
      if (stylesData.styles?.length) {
        console.log('Стили в файле:');
        stylesData.styles.forEach((style: any) => {
          console.log(`  • ${style.name} (${style.styleType})`);
        });
      } else {
        console.log('Публикуемые стили не найдены');
      }
    }

    // Пробуем получить изображения через другой endpoint
    console.log('\n\n🖼️ Пробуем экспортировать фреймы...');
    const allFrames: any[] = [];
    
    function collectFrames(node: any) {
      if (node.type === 'FRAME' || node.type === 'COMPONENT') {
        allFrames.push({ id: node.id, name: node.name });
      }
      node.children?.forEach(collectFrames);
    }
    
    data.document?.children?.forEach((page: any) => {
      page.children?.forEach(collectFrames);
    });

    if (allFrames.length > 0) {
      const frameIds = allFrames.slice(0, 10).map(f => f.id).join(',');
      const imgResponse = await fetch(
        `https://api.figma.com/v1/images/${FILE_ID}?ids=${frameIds}&format=png&scale=2`,
        { headers: { 'X-Figma-Token': FIGMA_TOKEN } }
      );
      
      if (imgResponse.ok) {
        const imgData = await imgResponse.json();
        const images = imgData.images || {};
        
        let successCount = 0;
        allFrames.slice(0, 10).forEach((frame) => {
          const url = images[frame.id];
          if (url) {
            console.log(`  ✅ ${frame.name}: ${url.substring(0, 80)}...`);
            successCount++;
          }
        });
        
        if (successCount === 0) {
          console.log('  ⚠️ Изображения не сгенерированы. Возможно, файл слишком большой или нет прав на экспорт.');
        }
      }
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

analyzeFigmaFile();
