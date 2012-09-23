
/*
This takes in JS looking code and spits out coin code
It also takes coin code and spits out JS
*/

var parser={}
parser.code=[];
parser.codes={};
parser.codes.INT_OP				=1;
parser.codes.FLOAT_OP			=2;
parser.codes.UINT160_OP			=3;
parser.codes.BOOL_OP			=4;
parser.codes.PATH_OP			=5;
parser.codes.ADD_OP				=6;
parser.codes.SUB_OP				=7;
parser.codes.MUL_OP				=8;
parser.codes.DIV_OP				=9;
parser.codes.MOD_OP				=10;
parser.codes.GTR_OP				=11;
parser.codes.LESS_OP			=12;
parser.codes.EQUAL_OP			=13;
parser.codes.NOT_EQUAL_OP		=14;
parser.codes.AND_OP				=15;
parser.codes.OR_OP				=16;
parser.codes.NOT_OP				=17;
parser.codes.BLOCK_OP			=18;
parser.codes.BLOCK_END_OP		=19;
parser.codes.JUMP_OP			=20;
parser.codes.JUMPIF_OP			=21;
parser.codes.STOP_OP			=22;
parser.codes.SET_DATA_OP		=23;
parser.codes.GET_DATA_OP		=24;
parser.codes.GET_ISSUER_ID_OP	=25;
parser.codes.GET_OWNER_ID_OP	=26;
parser.codes.GET_LEDGER_TIME_OP =27;
parser.codes.ACCEPT_DATA_OP		=28;
parser.codes.SEND_XNS_OP		=29;


parser.functions={};
parser.functions.stop 			= parser.codes.STOP_OP;
parser.functions.sendXNS		= parser.codes.SEND_XNS_OP;
parser.functions.getIssuerID	= parser.codes.GET_ISSUER_ID_OP;
parser.functions.getOwnerID		= parser.codes.GET_OWNER_ID_OP;
parser.functions.getLedgerTime	= parser.codes.GET_LEDGER_TIME_OP;
parser.functions.getData		= parser.codes.GET_DATA_OP;
parser.functions.setData		= parser.codes.SET_DATA_OP;

parser.localVariables={};
parser.blockJump=0;


function isString(value) {
    return value.constructor === String;
}

function isBool(value) {
    return value.constructor === Boolean;
}

function isInt(value) {
	return Math.floor(value)== value;
}



// takes in a string of the code
// returns a byte array of the bytecode
parser.js2coinCode=function(content)
{
	syntax = esprima.parse(content, { tolerant: true, loc: false });
	if(syntax.errors.length) 
	{
		ncc.error("Parse Error: "+syntax.errors[0]);
	}else
	{
		parser.code=[];
		for(var n=0; n<syntax.body.length; n++)
		{
			parser.addNode(syntax.body[n]);
		}
		return(parser.code);
	}  
}

// takes in a byte array and returns the code in string form
parser.coinCode2js=function(data)
{

	// TODO:
	var retStr='';
	parser.instructionPointer=0;
	while(parser.instructionPointer<data.length)
	{
		retStr += parser.decodeNext(data);
	}
	return(retStr);
}

parser.decodeNext=function(data)
{
	switch(data[parser.instructionPointer])
	{
		case parser.codes.INT_OP:
		break;
		case parser.codes.FLOAT_OP:
		break;
		case parser.codes.UINT160_OP:
		break;
		case parser.codes.BOOL_OP:
		break;
		case parser.codes.JUMP_OP:
		break;
		case parser.codes.JUMPIF_OP:
		break;
		default:
	}
	
}

parser.addNode=function(node)
{
	if(!node) return;
	
	// determine type of node
	switch(node.type)
	{
		case "IfStatement" :
			parser.addIf(node);
		break;
		
		case "WhileStatement":
			parser.addWhile(node);
		break;
		
		case "VariableDeclaration":
			parser.addSetVariable(node);
		break;
		
		case "BlockStatement":
		{
			for(var n=0; n<node.body.length; n++)
			{
				parser.addNode(node.body[n]);
			}
		}break;
		
		case "Identifier":
			parser.addGetVariable(node);
		break;
		
		case "BinaryExpression": // +,-,/,*,&, | 
			parser.addMathOperation(node);
		break;
		
		case "Literal":
			parser.addLiteral(node);
		break;
		
		case "CallExpression":
			parser.addFunction(node);
		break;
		
		case "ExpressionStatement":
		{
			switch(node.expression.type)
			{
				case "CallExpression":
					parser.addFunction(node.expression);
				break;
				
				case "AssignmentExpression":
					parser.addSetVariable(node);
				break;
				
				default:
					ncc.error("Unknown expression "+node.expression.type);
			}
		}break;
		default:
			ncc.error("Unknown type "+node.type);
	}
	
}

parser.addSetVariable=function(node)
{
	// from assignment
	if(node.operator=='=')
	{
		node.left.name
		
	}
}

parser.addGetVariable=function(node)
{
}

parser.addMathOperation=function(node)
{
	parser.addNode(node.left);
	parser.addNode(node.right);
	
	switch(node.operator)
	{
		case '+':		
			parser.code[ parser.code.length ]= parser.codes.ADD_OP;
		break;
		case '-':		
			parser.code[ parser.code.length ]= parser.codes.SUB_OP;
		break;
		case '*': 
			parser.code[ parser.code.length ]= parser.codes.MUL_OP;
		break;
		case '/': 
			parser.code[ parser.code.length ]= parser.codes.DIV_OP;
		break;
		case '>': 
			parser.code[ parser.code.length ]= parser.codes.GTR_OP;
		break;
		case '<': 
			parser.code[ parser.code.length ]= parser.codes.LESS_OP;
		break;
		
		default:
			ncc.error("Unknown operator "+node.operator);
	}
}

parser.addFunction=function(node)
{
	if( node.callee.name==='startBlock' )
	{
		parser.code[ parser.code.length ]= parser.codes.BLOCK_OP;
		parser.blockJump=parser.code.length;
		parser.writeInt(0,parser.code.length);
		
	}else if( node.callee.name==='endBlock' )
	{ 
		parser.code[ parser.code.length ]= parser.codes.BLOCK_END_OP;
		parser.writeInt(parser.code.length-parser.blockJump-4,parser.blockJump);
		parser.blockJump=0;
		
	}else if( parser.functions[node.callee.name] )
	{
		for(var n=0; n<node.arguments.length; n++)
		{
			parser.addNode(node.arguments[n]);
		}
		parser.code[ parser.code.length ]= parser.functions[node.callee.name];
		
	}else
	{
		ncc.error("Unknown function "+node.callee.name);
	}
}

// TODO:
parser.writeInt=function(value,loc)
{
	parser.code[ loc ]=value;
	parser.code[ loc+1 ]=value;
	parser.code[ loc+2 ]=value;
	parser.code[ loc+3 ]=value;
}

parser.addIf=function(node)
{
	parser.addNode(node.test);
	
	parser.code[ parser.code.length ]= parser.codes.JUMPIF_OP;
	var trueOffsetLocation=parser.code.length;
	parser.writeInt(0,parser.code.length);
	
	parser.addNode(node.alternate);
	
	parser.code[ parser.code.length ]= parser.codes.JUMP_OP;
	var falseOffsetLocation=parser.code.length;
	parser.writeInt(0,parser.code.length);
	
	parser.writeInt(parser.code.length-trueOffsetLocation-4,trueOffsetLocation);
	parser.addNode(node.consequent);
	parser.writeInt(parser.code.length-falseOffsetLocation-4,falseOffsetLocation);
	
}

// we allow int,float,bool,uint160
parser.addLiteral=function(node)
{
	if( isBool(node.value) )
	{
		parser.code[ parser.code.length ]= parser.codes.BOOL_OP;
		parser.code[ parser.code.length ]= node.value;
	}else if( isInt(node.value) )
	{ // 
		parser.code[ parser.code.length ]= parser.codes.INT_OP;
		parser.writeInt(node.value,parser.code.length);
	}else // must be a float
	{
		parser.code[ parser.code.length ]= parser.codes.FLOAT_OP;
		parser.code[ parser.code.length ]= node.value;
		parser.code[ parser.code.length ]= node.value;
		parser.code[ parser.code.length ]= node.value;
		parser.code[ parser.code.length ]= node.value;
	}
}
