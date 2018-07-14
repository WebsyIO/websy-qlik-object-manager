let config = {
  api: "capability",
  defaultView: "test",
  apps: [
    {
      id: "7c45fa00-1cc2-40cb-8548-1c3d21606ac7",
      host: "ec2-35-171-16-134.compute-1.amazonaws.com",
      port: 80,
      prefix: "/anon/",
      isSecure: false
    },
    {
      id: "0ddf1b38-0d83-4e99-a088-ca1f5418739e",
      host: "ec2-35-171-16-134.compute-1.amazonaws.com",
      port: 80,
      prefix: "/anon/",
      isSecure: false
    }
  ],
	actions: [
		{
			app: ["7c45fa00-1cc2-40cb-8548-1c3d21606ac7", "0ddf1b38-0d83-4e99-a088-ca1f5418739e"],
			elementId: "ch1_1",
			event: "click",
			items: [
				{
					method: "selectValues",
					field: "Country",
					params: [[{qText: "US"}], false]
				}
			]
		},
		{
			app: ["7c45fa00-1cc2-40cb-8548-1c3d21606ac7", "0ddf1b38-0d83-4e99-a088-ca1f5418739e"],
			elementId: "ch1",
			event: "click",
			items: [
				{
					method: "clearAll",
					params: []
				}
			]
		}
	],
  views: {
    test: [
      {
        app: ["7c45fa00-1cc2-40cb-8548-1c3d21606ac7"],
        elementId: "ch1",
        actions: {
					click: {
						method: "clearAll",
						params: []
					}
				}
      },
      {
        app: "7c45fa00-1cc2-40cb-8548-1c3d21606ac7",
        elementId: "ch2",
        type: "piechart",
        columns: ["Country", "=Sum([Sales Amount])"],
        options: {},
				help: "This visualisation does x, y and z."
      },
      {
        app: "7c45fa00-1cc2-40cb-8548-1c3d21606ac7",
        elementId: "ch3",
        definition: {
          qInfo: {
            qType: "picasso-barchart"
          },
          qHyperCubeDef: {
            qDimensions: [{
              qDef: { qFieldDefs: ["Country"] }
            }],
            qMeasures: [{
              qDef: { qDef: "Sum([Sales Amount])" }
            }],
            qInitialDataFetch: [{
              qTop: 0,
              qLeft: 0,
              qWidth: 2,
              qHeight: 50
            }]
          }
        }
      },
      {
        app: "0ddf1b38-0d83-4e99-a088-ca1f5418739e",
        elementId: "ch4",
        objectId: "hRZaKk"
      }
    ]
  },
  visualisationPlugins: [
    {
      id: "echarts-linechart",
      definition: WebsyEChartsLinechart
    },
    {
      id: "picasso-barchart",
      definition: WebsyPicassoWrapper
    }
  ]
}

let wom = new WebsyQlikObjectManager(config, err=>{
  if (err) {
    console.log(err);
  }
  else {

    console.log(wom);
  }
})
