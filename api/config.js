module.exports=(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY;
  const configured=!!(url&&key&&process.env.SUPABASE_SERVICE_ROLE_KEY);
  res.status(200).json(configured?{configured:true,url,publishableKey:key}:{configured:false});
};
