/**
 * 获得基金各种数据
 */
var fdata = (function(doc) { // 使用闭包，变量隐藏
	/** 获得同花顺基金估值地址 */
	var thsValuationUrl = "http://gz.fund.10jqka.com.cn/?module=api&controller=index&action=real&codes=";

	/** 获得好买网基金估值地址 */
	var hmValuationUrl = "http://www.howbuy.com/fund/ajax/gmfund/fundnetestimatejson.htm?jjdmstr=";

	/** 获得天天基金估值地址,每次一个 */
	var ttValuationUrl = "http://fund.eastmoney.com/data/funddataforgznew.aspx?t=basewap&cb=a&fc=";

	/** 获得基金的信息 */
	var fundInfoUrl = "http://fund.10jqka.com.cn/data/client/myfund/";

	var fv = function() {
		//构造函数
	};


	/* 获得基金的估值,暂时先一个个的取，取一段数据插一段 */
	fv.getFundValuation = function(fundcode) {
		//? mui.ajaxSettings.async = 'false';
		var table = document.body.querySelector('.mui-table-view');
		//var cells = document.body.querySelectorAll('.mui-table-view-cell');

		var li = document.createElement('li');
		li.className = 'mui-table-view-cell';
		li.innerHTML = '基金代码: ' + fundcode;
		table.appendChild(li);

		//  天天基金估值
		mui.get(ttValuationUrl + fundcode, '', function(script) {
			console.log(script);
			var fval = JSON.parse(script.substring(2, script.length - 2)) // 参数cb=a

			var li = document.createElement('li');
			li.className = 'mui-table-view-cell';
			li.innerHTML = '基金名称: ' + fval.name;
			table.appendChild(li);

			var li = document.createElement('li');
			li.className = 'mui-table-view-cell';
			li.innerHTML = '基金净值: ' + fval.dwjz;
			table.appendChild(li);
			var li = document.createElement('li');
			li.className = 'mui-table-view-cell';
			li.innerHTML = '基金净值时间: ' + fval.jzrq;
			table.appendChild(li);
			var li = document.createElement('li');
			li.className = 'mui-table-view-cell';
			li.innerHTML = '基金估值时间: ' + fval.gztime;
			table.appendChild(li);
			var li = document.createElement('li');
			li.className = 'mui-table-view-cell';
			li.innerHTML = '天天基金估值: ' + fval.gsz + "_" + fval.gszzl + "%";
			table.appendChild(li);

		}, 'ascript'); // script还要试

		//  同花顺估值
		mui.getJSON(thsValuationUrl + fundcode, '', function(jsonData) {
			console.log(JSON.stringify(jsonData));
			//doc.getElementById("log").innerHTML = JSON.stringify(data);

			var fval = jsonData.data[fundcode];
			//console.log(fval);

			/*
			var li = document.createElement('li');
			li.className = 'mui-table-view-cell';
			li.innerHTML = '基金净值(上日): ' + fval.pre;
			table.appendChild(li);
			var li = document.createElement('li');
			li.className = 'mui-table-view-cell';
			li.innerHTML = '基金估值时间: ' + fval.date + "_" + fval.time;
			table.appendChild(li);
			*/

			var li = document.createElement('li');
			li.className = 'mui-table-view-cell';
			li.innerHTML = '同花顺估值: ' + fval.value;
			table.appendChild(li);

		});

		//  好买网估值
		mui.getJSON(hmValuationUrl + fundcode, '', function(jsonData) {
			console.log(JSON.stringify(jsonData));
			var fval = jsonData[0];

			var li = document.createElement('li');
			li.className = 'mui-table-view-cell';
			li.innerHTML = '好买网估值: ' + fval.valuation + "_" + fval.gzhb + "%";
			table.appendChild(li);

		});


	};


	return fv;
})(document);