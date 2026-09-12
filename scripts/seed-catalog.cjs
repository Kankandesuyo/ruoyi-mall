// Local demo catalog: node scripts/seed-catalog.cjs [--apply]
// Image files and provenance are kept in scripts/catalog-assets for reproducibility.
const fs = require('fs');
const path = require('path');
const {spawnSync} = require('child_process');
const root = path.resolve(__dirname, '..');
const assets = path.join(__dirname, 'catalog-assets');
const runtime = path.join(root, '.runtime');
const mysql = 'C:/Program Files/MySQL/MySQL Server 8.4/bin/mysql.exe';
const client = `--defaults-extra-file=${runtime.replaceAll('\\', '/')}/mysql-client.ini`;
const origin = process.env.CATALOG_IMAGE_ORIGIN || 'http://127.0.0.1:8080';
if (!/^https?:\/\/[\w.:-]+$/.test(origin)) throw Error('Invalid CATALOG_IMAGE_ORIGIN');
const manifest = JSON.parse(fs.readFileSync(path.join(assets, 'manifest.json'), 'utf8'));
const q = value => value == null ? 'NULL' : "'" + String(value).replaceAll('\\', '\\\\').replaceAll("'", "''") + "'";
function run(sql) {
  const r = spawnSync(mysql, [client, '--batch', '--raw', 'ruoyi_mall'], {input:sql, encoding:'utf8', maxBuffer:20*1024*1024});
  if (r.status !== 0) throw Error(r.stderr);
  return r.stdout;
}
const repairs = manifest.filter(x => x.existingId);
const additions = manifest.filter(x => !x.existingId);
if (repairs.length !== 3 || additions.length !== 20 || new Set(manifest.map(x=>x.file)).size !== 23) throw Error('Expected 3 repairs and 20 unique additions');
for (const p of manifest) {
  if (!/^[a-z0-9-]+\.(webp|png|jpg)$/.test(p.file)) throw Error('Invalid asset filename');
  if (fs.statSync(path.join(assets,p.file)).size < 1000) throw Error('Invalid image: '+p.file);
}
const sql = ['SET NAMES utf8mb4;', 'START TRANSACTION;'];
for (const p of manifest) {
  const pic = origin + '/profile/catalog-20260912/' + p.file;
  if (p.existingId) {
    // Preserve product names, prices, stock, SKU attributes and all historical snapshots.
    sql.push(`UPDATE pms_product SET pic=${q(pic)},album_pics=${q(pic)},detail_html=REPLACE(detail_html,${q(p.oldDetailImage)},${q(pic)}),detail_mobile_html=REPLACE(detail_mobile_html,${q(p.oldDetailImage)},${q(pic)}),update_time=NOW(3) WHERE id=${p.existingId};`);
    sql.push(`UPDATE pms_sku SET pic=${q(pic)},update_time=NOW(3) WHERE product_id=${p.existingId};`);
  } else {
    const code = 'DEMO-20260912-' + p.sourceId;
    const category = {100:'服饰内衣',101:'手机数码',102:'家居生活'}[p.categoryId];
    const detail = `<h3>${p.name}</h3><p>${p.description}</p><p>规格：${p.spec}。积分兑换演示商品，价格和库存用于本地功能演示。</p><p><img src="${pic}" alt="${p.name}" style="max-width:100%;height:auto" /></p>`;
    const attrs = JSON.stringify({'规格':p.spec});
    const productAttrs = JSON.stringify([{name:'规格',options:[{name:p.spec}]}]);
    sql.push(`INSERT INTO pms_product (category_id,out_product_id,name,pic,album_pics,publish_status,sort,price,unit,detail_html,detail_mobile_html,brand_name,product_category_name,create_time,product_attr) SELECT ${p.categoryId},${q(code)},${q(p.name)},${q(pic)},${q(pic)},1,${p.sort},${p.price},'件',${q(detail)},${q(detail)},${q(p.brand || '精选好物')},${q(category)},NOW(3),${q(productAttrs)} WHERE NOT EXISTS (SELECT 1 FROM pms_product WHERE out_product_id=${q(code)});`);
    sql.push(`SET @pid=(SELECT id FROM pms_product WHERE out_product_id=${q(code)});`);
    sql.push(`INSERT INTO pms_sku(product_id,out_sku_id,price,pic,stock,sp_data,create_time) SELECT @pid,${q(code+'-STD')},${p.price},${q(pic)},${p.stock},${q(attrs)},NOW(3) WHERE NOT EXISTS (SELECT 1 FROM pms_sku WHERE out_sku_id=${q(code+'-STD')});`);
  }
}
sql.push('COMMIT;');
fs.mkdirSync(path.join(runtime,'catalog'),{recursive:true});
fs.writeFileSync(path.join(runtime,'catalog','seed.sql'),sql.join('\n'));
if (!process.argv.includes('--apply')) {
  console.log('Prepared 20 additions and 3 image repairs. Run with --apply to write the local database.');
  process.exit(0);
}
// mysqldump backup, saved under ignored .runtime; credentials are read from the client config.
const backup = path.join(runtime,'catalog','before-'+Date.now()+'.sql');
const dump = spawnSync(mysql.replace('mysql.exe','mysqldump.exe'),[client,'--single-transaction','--skip-lock-tables','--no-tablespaces','ruoyi_mall','pms_product','pms_sku'],{encoding:'utf8',maxBuffer:20*1024*1024});
if (dump.status !== 0) throw Error(dump.stderr);
fs.writeFileSync(backup,dump.stdout);
const dest = path.join(runtime,'uploads','catalog-20260912');
fs.mkdirSync(dest,{recursive:true});
for (const p of manifest) fs.copyFileSync(path.join(assets,p.file),path.join(dest,p.file));
console.log(run(sql.join('\n')));
console.log(run("SELECT COUNT(*) AS total_products FROM pms_product; SELECT COUNT(*) AS seeded_products FROM pms_product WHERE out_product_id LIKE 'DEMO-20260912-%'; SELECT COUNT(*) AS seeded_skus FROM pms_sku WHERE out_sku_id LIKE 'DEMO-20260912-%';"));
console.log('Backup: '+backup);
