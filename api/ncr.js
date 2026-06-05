
export default async function handler(req,res){
 const data=[
   {Supplier:'Sample Supplier',Part:'Part A',Phenomenon:'Defect',Quantity:1}
 ];
 res.status(200).json(data);
}
