'''
使用前请安装 requests 模块：
pip install requests

请在zh_cn.json中填写内容, 随后运行此脚本, 将自动翻译为其他语言并覆盖原文件。
cd common/src/main/resources/assets/mtrsteamloco/lang
python translate.py
'''

import os
import json
import hashlib
import random
import requests

# 配置文件路径
# {"appid": "你的 APP ID", "secret_key": "你的密钥"}
config_file = r'D:\bdapi.json'

# 目标语言代码映射
target_languages = {
    'de_de': 'de',  # 德语
    'en_us': 'en',  # 英语
    'ja_jp': 'jp',  # 日语
    'pt_pt': 'pt',  # 葡萄牙语
    'zh_cn': 'zh',  # 简体中文（无需翻译）
    'zh_hk': 'cht',  # 繁体中文（香港）
    'zh_tw': 'cht',  # 繁体中文（台湾）
    'fr_fr': 'fra',  # 法语
    'es_es': 'spa',  # 西班牙语
    'it_it': 'it',  # 意大利语
    'ru_ru': 'ru',  # 俄语
    'ko_kr': 'kor',  # 韩语
}
'''
    'ar_sa': 'ara',  # 阿拉伯语
    'nl_nl': 'nl',  # 荷兰语
    'sv_se': 'swe',  # 瑞典语
    'pl_pl': 'pl',  # 波兰语
    'tr_tr': 'tr',  # 土耳其语
    'cs_cz': 'cs',  # 捷克语
    'da_dk': 'dan',  # 丹麦语
    'fi_fi': 'fin',  # 芬兰语
    'el_gr': 'el',  # 希腊语
    'hu_hu': 'hu',  # 匈牙利语
    'no_no': 'no',  # 挪威语
    'ro_ro': 'rom',  # 罗马尼亚语
    'sk_sk': 'sk',  # 斯洛伐克语
    'th_th': 'th',  # 泰语
    'uk_ua': 'uk',  # 乌克兰语
    'vi_vn': 'vie',  # 越南语
    'he_il': 'iw',  # 希伯来语
    'id_id': 'id',  # 印尼语
    'ms_my': 'ms',  # 马来语
    'hi_in': 'hi',  # 印地语
    'bn_in': 'bn',  # 孟加拉语
    'ta_in': 'ta',  # 泰米尔语
    'te_in': 'te',  # 泰卢固语
    'ml_in': 'ml',  # 马拉雅拉姆语
    'mr_in': 'mr',  # 马拉地语
    'gu_in': 'gu',  # 古吉拉特语
    'kn_in': 'kn',  # 卡纳达语
    'or_in': 'or',  # 奥里亚语
    'pa_in': 'pa',  # 旁遮普语
    'as_in': 'as',  # 阿萨姆语
    'sd_in': 'sd',  # 信德语
    'si_lk': 'si',  # 僧伽罗语
    'ne_np': 'ne',  # 尼泊尔语
    'my_mm': 'my',  # 缅甸语
    'lo_la': 'lo',  # 老挝语
    'km_kh': 'km',  # 高棉语
    'tg_tj': 'tg',  # 塔吉克语
    'ky_kg': 'ky',  # 吉尔吉斯语
    'uz_uz': 'uz',  # 乌兹别克语
    'kk_kz': 'kk',  # 哈萨克语
    'az_az': 'az',  # 阿塞拜疆语
    'hy_am': 'hy',  # 亚美尼亚语
    'ka_ge': 'ka',  # 格鲁吉亚语
    'be_by': 'be',  # 白俄罗斯语
    'lv_lv': 'lv',  # 拉脱维亚语
    'lt_lt': 'lt',  # 立陶宛语
    'et_ee': 'et',  # 爱沙尼亚语
    'mt_mt': 'mt',  # 马耳他语
    'is_is': 'is',  # 冰岛语
    'hr_hr': 'hr',  # 克罗地亚语
    'sl_si': 'sl',  # 斯洛文尼亚语
    'bs_ba': 'bs',  # 波斯尼亚语
    'mk_mk': 'mk',  # 马其顿语
    'sq_al': 'sq',  # 阿尔巴尼亚语
    'gl_es': 'gl',  # 加利西亚语
    'eu_es': 'eu',  # 巴斯克语
    'ca_es': 'ca',  # 加泰罗尼亚语
    'af_za': 'af',  # 南非荷兰语
    'sw_ke': 'sw',  # 斯瓦希里语
    'ur_pk': 'ur',  # 乌尔都语
    'fa_ir': 'fa',  # 波斯语
    'sd_pk': 'sd',  # 信德语（巴基斯坦）
    'ug_cn': 'ug',  # 维吾尔语
    'bo_cn': 'bo',  # 藏语
    'mn_mn': 'mn',  # 蒙古语
    'ha_ng': 'ha',  # 豪萨语
    'so_so': 'so',  # 索马里语
    'am_et': 'am',  # 阿姆哈拉语
    'ti_er': 'ti',  # 提格雷尼亚语
    'ps_af': 'ps',  # 普什图语
    'ku_tr': 'ku',  # 库尔德语
    'dv_mv': 'dv',  # 迪维希语
    'ny_mw': 'ny',  # 齐切瓦语
    'sn_zw': 'sn',  # 绍纳语
    'ts_za': 'ts',  # 聪加语
    've_za': 've',  # 文达语
    'xh_za': 'xh',  # 科萨语
    'zu_za': 'zu',  # 祖鲁语
    'ss_za': 'ss',  # 斯威士语
    'st_za': 'st',  # 塞索托语
    'tn_za': 'tn',  # 茨瓦纳语
    'rw_rw': 'rw',  # 卢旺达语
    'or_od': 'or',  # 奥里亚语（奥里萨邦）
    'br_fr': 'br',  # 布列塔尼语
    'cy_gb': 'cy',  # 威尔士语
    'gd_gb': 'gd',  # 苏格兰盖尔语
    'ga_ie': 'ga',  # 爱尔兰语
    'iu_ca': 'iu',  # 因纽特语
    'mi_nz': 'mi',  # 毛利语
    'sm_ws': 'sm',  # 萨摩亚语
    'to_to': 'to',  # 汤加语
    'fj_fj': 'fj',  # 斐济语
    'ty_pf': 'ty',  # 塔希提语
    'haw_us': 'haw',  # 夏威夷语
    'yua_mx': 'yua',  # 尤卡坦玛雅语
    'quc_gt': 'quc',  # 基切语
    'gn_py': 'gn',  # 瓜拉尼语
    'ay_pe': 'ay',  # 艾马拉语
    'nah_mx': 'nah',  # 纳瓦特尔语
    'otq_mx': 'otq',  # 奥托米语
    'tpi_pg': 'tpi',  # 托克皮辛语
    'ho_pg': 'ho',  # 希里莫图语
    'bi_vu': 'bi',  # 比斯拉马语
    'fj_vu': 'fj',  # 斐济语（瓦努阿
'''

# 翻译函数
def translate_text(query, from_lang='zh', to_lang='en', appid=None, secret_key=None):
    if not appid or not secret_key:
        raise ValueError("APP ID 或密钥未提供")
    
    # 定义翻译 API 的 URL
    url = 'http://api.fanyi.baidu.com/api/trans/vip/translate'
    
    salt = random.randint(32768, 65536)
    sign = hashlib.md5((appid + query + str(salt) + secret_key).encode('utf-8')).hexdigest()
    params = {
        'q': query,
        'from': from_lang,
        'to': to_lang,
        'appid': appid,
        'salt': salt,
        'sign': sign
    }
    try:
        response = requests.get(url, params=params)
        result = response.json()
        if 'trans_result' in result:
            return result['trans_result'][0]['dst']
        else:
            print(f"翻译失败: {result}")
            return query
    except Exception as e:
        print(f"请求失败: {e}")
        return query

# 加载配置文件
def load_config(file_path):
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"配置文件未找到: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        config = json.load(f)
    
    if 'appid' not in config or 'secret_key' not in config:
        raise ValueError("配置文件中缺少 APP ID 或密钥")
    
    return config['appid'], config['secret_key']

# 主函数
def translate_json(input_file, output_dir, appid, secret_key):
    # 确保输出目录存在
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # 加载源 JSON 文件
    with open(input_file, 'r', encoding='utf-8') as f:
        source_data = json.load(f)

    # 遍历目标语言
    for lang_code, baidu_lang_code in target_languages.items():
        translated_data = {}
        for key, value in source_data.items():
            if lang_code == 'zh_cn':  # 简体中文无需翻译
                translated_data[key] = value
            else:
                translated_data[key] = translate_text(value, to_lang=baidu_lang_code, appid=appid, secret_key=secret_key).replace('% s', '%s')
                print(f"已翻译: {key} -> {translated_data[key]}")

        # 保存翻译后的 JSON 文件
        output_file = os.path.join(output_dir, f'{lang_code}.json')
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(translated_data, f, ensure_ascii=False, indent=4)
        print(f"已保存: {output_file}")

# 运行脚本
if __name__ == '__main__':
    input_file = './zh_cn.json'  # 输入文件路径
    output_dir = './'  # 输出目录

    try:
        # 加载账户信息
        appid, secret_key = load_config(config_file)
        print("配置文件加载成功！")

        # 开始翻译
        translate_json(input_file, output_dir, appid, secret_key)
    except Exception as e:
        print(f"错误: {e}")