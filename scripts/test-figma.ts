import 'dotenv/config';

const FIGMA_TOKEN = process.env.FIGMA_TOKEN!;
const FILE_ID = 'x0kQhyYX0fclIGMqIxRePL';

if (!FIGMA_TOKEN) {
  console.error('❌ FIGMA_TOKEN not found in .env');
  process.exit(1);
}

async function testFigmaAccess() {
  try {
    // Проверяем базовый доступ к файлу
    const response = await fetch(`https://api.figma.com/v1/files/${FILE_ID}?geometry=paths&plugin_data=shared`, {
      headers: {
        'X-Figma-Token': FIGMA_TOKEN,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ API Error:', error);
      process.exit(1);
    }

    const data = await response.json();
    
    console.log('✅ Доступ к Figma API есть!\n');
    console.log('📁 Файл:', data.name);
    console.log('📝 Версия:', data.version);
    console.log('👤 Автор:', data.lastModifiedBy?.handle || 'Unknown');
    console.log('📅 Последнее изменение:', data.lastModified);
    console.log('\n📄 Структура страниц:');
    
    data.document?.children?.forEach((page: any, i: number) => {
      console.log(`  ${i + 1}. ${page.name} (${page.children?.length || 0} элементов)`);
    });

    // Получаем конкретные ноды
    const nodeIds = ['3-44', '3-93', '3-146', '3-2', '3-23'];
    console.log('\n🔍 Проверка доступа к экранам:');
    
    const nodesResponse = await fetch(
      `https://api.figma.com/v1/files/${FILE_ID}/nodes?ids=${nodeIds.map(id => `${FILE_ID}:${id}`).join(',')}`,
      {
        headers: {
          'X-Figma-Token': FIGMA_TOKEN,
        },
      }
    );

    if (nodesResponse.ok) {
      const nodesData = await nodesResponse.json();
      const nodes = nodesData.nodes || {};
      
      nodeIds.forEach((id) => {
        const fullId = `${FILE_ID}:${id}`;
        const node = nodes[fullId];
        if (node) {
          console.log(`  ✅ ${id}: ${node.document?.name || 'OK'}`);
        } else {
          console.log(`  ⚠️  ${id}: не найден или нет доступа`);
        }
      });
    }

    // Получаем изображения для нод
    console.log('\n🖼️  Получение изображений экранов:');
    const imagesResponse = await fetch(
      `https://api.figma.com/v1/images/${FILE_ID}?ids=${nodeIds.join(',')}&format=png&scale=2`,
      {
        headers: {
          'X-Figma-Token': FIGMA_TOKEN,
        },
      }
    );

    if (imagesResponse.ok) {
      const imagesData = await imagesResponse.json();
      const images = imagesData.images || {};
      
      nodeIds.forEach((id) => {
        if (images[id]) {
          console.log(`  ✅ ${id}: ${images[id]}`);
        } else {
          console.log(`  ⚠️  ${id}: изображение недоступно`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

testFigmaAccess();
