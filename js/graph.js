var gRoot=[];

$(document).ready(function() 
{
    setUpD3();
    rpc.ledger(onLedger);
});


/*
{
          "Balance": {
            "currency": "USD",
            "issuer": "rrrrrrrrrrrrrrrrrrrrBZbvji",
            "value": "0"
          },
          "Flags": 0,
          "HighLimit": {
            "currency": "USD",
            "issuer": "rUcNf57MsKobu1bU7nWqVCb61SoFEAryKj",
            "value": "0"
          },
          "LastTxnID": "2A94A4C741C89F3452BBE6F7051911BE31178D1942778BF2AD3315C69030A59D",
          "LastTxnSeq": 13842,
          "LedgerEntryType": "RippleState",
          "LowLimit": {
            "currency": "USD",
            "issuer": "r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV",
            "value": "200"
          },
          "index": "4F6142EBB3259F986F73765B21EDBE45CB9D64637954027D3AE7F3AEEA6EE8FF"
        },
        
         {
          "Account": "r4Ld6WeC1NvqF9XbaVmG89sR6ca7fBiNyc",
          "Balance": "2000000000",
          "Flags": 0,
          "LastTxnID": "F9C6B619F4527D7C1F883C64DC3DE82B5D722B6576C3142D5440F31E62B10932",
          "LastTxnSeq": 17396,
          "LedgerEntryType": "AccountRoot",
          "Sequence": 1,
          "index": "7577C69835409E431CBAEE586258557E0B6FBB7542A232C4E034B6013B110692"
        },
        
*/
function onLedger(response, success)
{
	if(response.ledger) 
	{
		var nodeMap={};
		var nodeArray=[];
		var accounts = response.ledger.accountState;
		for (var i = 0; i < accounts.length; i++) 
		{
			var account=accounts[i];
			
			if(account.LedgerEntryType == "AccountRoot") 
			{
				if(!nodeMap[account.Account])
				{
					nodeMap[account.Account]=nodeArray.length;
					nodeArray.push(account);
				}
  			}	
		}
		
		var lines=[];
		
		for (var i = 0; i < accounts.length; i++) 
		{
			var account=accounts[i];
			
			if(account.LedgerEntryType == "RippleState") 
			{
				var link={};
				link.source=nodeMap[ account.LowLimit.issuer ];
				link.target=nodeMap[ account.HighLimit.issuer ];
				link.currency=account.Balance.currency;
				link.LowLimit=account.LowLimit.value;
				link.HighLimit=account.HighLimit.value;
				link.value= parseFloat(account.LowLimit.value) + parseFloat(account.HighLimit.value);
				
				lines.push(link);
  			}	
		}
		
		
  

    	drawGraph(nodeArray,lines);
	}
}



/*
Mousing over a layer brings up details of the layer
Links are:
    source 
    target
    from
    to

*/

function setUpD3()
{
    gRoot.first=true;
    var width = 1500, height = 700;

    gRoot.color = d3.scale.category10();

    gRoot.force = d3.layout.force()
        .charge(-250)
        .linkDistance(100)
        .size([width, height]);

    gRoot.svg= d3.select("#TestSVG")
        .attr("width", width)
        .attr("height", height);

}
function drawGraph(nodes,links)
{
     gRoot.force
          .nodes(nodes)
          .links(links)
          .start();

     var link = gRoot.svg.selectAll("line.link")
          .data(links);

    link.enter().append("line")
          .attr("class", "link")
          .on("mouseover", function(d) { overLink(d); })
          .style("stroke-width", function(d) { return Math.min(20,Math.log(d.value)); });

    link.append("title")
          .text(function(d) { return d.value; });
   
    link.exit().remove();
   
    var node = gRoot.svg.selectAll("circle.node")
          .data(nodes);

    node.enter().append("circle")
          .attr("class", "node")
          .attr("r", function(d) { return Math.min(60,10+Math.log(d.Balance/BALANCE_DISPLAY_DIVISOR)); })
          .style("fill", gRoot.color(1) )
          .on("mouseover", function(d) { overNode(d); })
          .call(gRoot.force.drag);

    node.append("title")
          .text(function(d) { return d.Account; });
            
    node.exit().remove();
  
   
  
      gRoot.force.on("tick", function() {
      
      /*
       link.attr("x1", function(d) { return (d.source.x+d.target.x)/2; })
            .attr("y1", function(d) { return (d.source.y+d.target.y)/2; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
           */
           
       link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
            
       // console.log(""+link.x1+" "+link.y1+","+link.x2+" "+link.y2);
       

        node.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
      });
      
     
    
    
}

addCommas = function (n) 
{
  if (!/^\d+(.\d*)?$/.test(n)) throw "Invalid number format.";
  
  var s = n.toString(),
      m = s.match(/^(\d+?)((\d{3})*)(\.\d*)?$/),
      whole = [m[1]].concat(m[2].match(/\d{3}/g) || []),
      fract = m[4] || "";
  
  return whole + fract;
}

function overNode(node)
{
    // we can look up all the details since we pulled the whole ledger
    var bal=node.Balance /BALANCE_DISPLAY_DIVISOR;
    bal=addCommas(bal);
    
    $('#NodeData').html(node.Account+"<br>"+bal+" XNS");
}

function overLink(node)
{   
    $('#NodeData').html(node.currency+"<br>"+addCommas(node.LowLimit)+" -- "+addCommas(node.HighLimit));
}

////////////////////// 
// so we don't have to include everything

var ncc = {};

ncc.error = function (error, json) {
  console.log("ERROR: " + error);
}

ncc.info = function (status, json) {
  console.log("INFO: " + status);
}



