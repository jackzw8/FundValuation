/**
 * 获得基金各种数据
 */
var FundData = (function() {  // 使用闭包，变量隐藏
	/** 获得同花顺基金估值地址 */
	var thsValuationUrl = "http://gz.fund.10jqka.com.cn/?module=api&controller=index&action=real&codes=";

	/** 获得好买网基金估值地址 */
	var hmValuationUrl = "http://www.howbuy.com/fund/ajax/gmfund/fundnetestimatejson.htm?jjdmstr=";

	/** 获得天天基金估值地址,每次一个 */
	var ttValuationUrl = "http://fund.eastmoney.com/data/funddataforgznew.aspx?t=basewap&fc=";

	/** 获得基金的信息 */
	var fundInfoUrl = "http://fund.10jqka.com.cn/data/client/myfund/";

	var fd = function () {
		//构造函数
	};
	
	/** 获得基金的估值 */
	fd.getFundValuation = function (fundlist) {
		mui.getJSON(thsValuationUrl+fundlist, '', function (data) {
			fd.fvals = JSON.parse(data);
		})
	};

	return fd;
})();


