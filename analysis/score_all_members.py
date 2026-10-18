import pandas as pd,numpy as np
e=pd.read_csv('HuskyHack_Synthetic_Events_v2.csv',parse_dates=['event_timestamp']);k=pd.read_csv('HuskyHack_Member_Key_v2.csv').set_index('synthetic_member_id')
print(e.member_response.value_counts().to_dict());print(k.scam_payment_ids.dropna().head(3).tolist())
rows=[]
for m,g in e.groupby('synthetic_member_id'):
    g=g.sort_values('event_sequence')
    for i,r in g[g.event_type=='Payment Initiated'].iterrows():
        t=r.event_timestamp;w=g[(g.event_timestamp<=t)&(g.event_timestamp>=t-pd.Timedelta(hours=72))]
        ty=set(w.event_type)
        s=0;sig=[]
        def a(c,p,n):
            global s
            if c:s+=p;sig.append(n)
        a(r.recipient_status=='New' and (pd.isna(r.recipient_age_days) or r.recipient_age_days<30),20,'new')
        ra=r.amount_to_baseline_ratio
        a(ra>=3,20,'amt3');a(1.5<=ra<3,10,'amt15')
        d=r.days_since_last_same_rail;a(pd.isna(d) and r.payment_rail in('Wire','ACH') or (d>=365),15,'firstRail')
        a('Password Reset' in ty,20,'reset');a(bool({'Email Change','Phone Change'}&ty),30,'contact');a('Address Change' in ty and not({'Email Change','Phone Change'}&ty),5,'addr')
        a(r.payment_rail=='Cash' and r.amount>=5000,25,'bigCash')
        a(bool({'Branch Visit','Contact Center Call'}&ty) and r.payment_rail in('Cash','Wire'),10,'assisted')
        pr=g[(g.event_timestamp<t)&(g.event_timestamp>=t-pd.Timedelta(days=30))&(g.event_type=='Payment Initiated')&(g.recipient_id==r.recipient_id)&g.recipient_id.notna()]
        base=r.amount/ra if ra and ra>0 else 1e9
        a((pr.amount.sum()+r.amount)>=3*base and r.recipient_status=='New' or ((pr.amount.sum()+r.amount)>=3*base and len(pr)>=1 and r.recipient_age_days<30),20,'cum')
        prior=g[(g.event_timestamp<t)&(g.event_type=='Payment Initiated')&(g.recipient_id==r.recipient_id)&g.recipient_id.notna()]
        a(len(prior)>=2 and prior.amount.is_monotonic_increasing and r.amount>prior.amount.iloc[-1],15,'rising')
        a(((g.event_type=='Warning Displayed')&(g.event_timestamp<t)&(g.recipient_id==r.recipient_id)).any(),15,'ignored')
        a(r.recipient_status=='Existing' and r.recipient_age_days>=30,-20,'known')
        ato='Password Reset' in ty and bool({'Email Change','Phone Change'}&ty)
        tier='Stop' if ato and s>=60 else 'Pause' if s>=45 else 'Nudge' if s>=25 else 'Pass'
        rows.append(dict(m=m,pid=r.payment_id,rail=r.payment_rail,amt=r.amount,s=s,tier=tier,sig=','.join(sig),t=t))
d=pd.DataFrame(rows);d.to_pickle('scored_payments.pkl')
d['grp']=d.m.map(lambda x:'legit' if k.loc[x,'is_legitimate_lookalike']=='Yes' else k.loc[x,'scenario_type'])
d['scam']=[ (isinstance(k.loc[m,'scam_payment_ids'],str) and p in k.loc[m,'scam_payment_ids']) for m,p in zip(d.m,d.pid)]
d.to_pickle('scored_payments.pkl')
n=k.groupby(k.index.map(lambda x:'legit' if k.loc[x,'is_legitimate_lookalike']=='Yes' else k.loc[x,'scenario_type'])).size()
print(n.to_dict())
print(d.groupby(['grp','tier']).size().unstack(fill_value=0))
# member level: first scam payment caught at Pause/Stop?
sc=d[d.scam].sort_values('t').groupby('m').first()
sc['caught']=sc.tier.isin(['Pause','Stop']);sc['grp']=sc.index.map(lambda x:k.loc[x,'scenario_type'])
print(sc.groupby('grp').caught.agg(['sum','count']))
# $ in scam pmts before first pause
print(sc.groupby('grp').tier.value_counts().unstack(fill_value=0))
# legit members flagged
lg=d[d.grp=='legit'];f=lg[lg.tier.isin(['Pause','Stop'])]
print('legit members w/ pause',f.m.nunique(),'of',lg.m.nunique(),'| payments flagged',len(f),'of',len(lg))
print(f.groupby(k.loc[f.m,'scenario_subtype'].values).m.nunique().to_dict())
nm=d[d.grp=='Normal Activity'];print('routine payments',len(nm),'pause+',nm.tier.isin(['Pause','Stop']).sum(),'nudge',(nm.tier=='Nudge').sum(), 'members',nm.m.nunique(),'members pause+',nm[nm.tier.isin(['Pause','Stop'])].m.nunique())
for m in['M1001','M1002','M1003','M1004','M1039','M1057']:print(d[d.m==m][['pid','rail','amt','s','tier','sig','scam']].tail(6).to_string())
