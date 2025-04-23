<?php

namespace Database\Seeders;

use App\Models\OkrTemplate;
use Illuminate\Database\Seeder;

class OkrTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Sales Team OKR Template
        OkrTemplate::create([
            'name' => 'Sales Team Performance',
            'description' => 'A template for sales teams focusing on revenue growth, customer acquisition, and sales efficiency.',
            'category' => 'Sales',
            'department' => 'Sales',
            'is_system' => true,
            'template_data' => [
                'objective' => [
                    'title' => 'Increase sales performance and market penetration',
                    'description' => 'Drive revenue growth while improving sales team efficiency and customer acquisition.',
                    'level' => 'team',
                    'status' => 'not_started',
                ],
                'key_results' => [
                    [
                        'title' => 'Achieve $X in quarterly revenue',
                        'description' => 'Reach the target revenue goal for the quarter.',
                        'status' => 'not_started',
                    ],
                    [
                        'title' => 'Increase customer acquisition by X%',
                        'description' => 'Grow the number of new customers compared to previous quarter.',
                        'status' => 'not_started',
                    ],
                    [
                        'title' => 'Improve conversion rate to X%',
                        'description' => 'Enhance the lead-to-customer conversion ratio.',
                        'status' => 'not_started',
                    ],
                    [
                        'title' => 'Reduce customer acquisition cost by X%',
                        'description' => 'Lower the average cost of acquiring new customers.',
                        'status' => 'not_started',
                    ]
                ],
                'initiatives' => [
                    [
                        'title' => 'Implement sales training program',
                        'description' => 'Train team on new sales techniques and product knowledge.',
                        'status' => 'not_started',
                    ],
                    [
                        'title' => 'Develop targeted prospect lists',
                        'description' => 'Create industry-specific prospect lists for outreach.',
                        'status' => 'not_started',
                    ],
                    [
                        'title' => 'Optimize sales pipeline stages',
                        'description' => 'Review and improve the sales pipeline for better conversion.',
                        'status' => 'not_started',
                    ]
                ]
            ]
        ]);

        // Marketing Team OKR Template
        OkrTemplate::create([
            'name' => 'Marketing Growth Strategy',
            'description' => 'A template for marketing teams focusing on brand awareness, lead generation, and campaign performance.',
            'category' => 'Marketing',
            'department' => 'Marketing',
            'is_system' => true,
            'template_data' => [
                'objective' => [
                    'title' => 'Enhance brand visibility and lead generation',
                    'description' => 'Increase brand awareness and generate more qualified leads for the sales team.',
                    'level' => 'team',
                    'status' => 'not_started',
                ],
                'key_results' => [
                    [
                        'title' => 'Increase website traffic by X%',
                        'description' => 'Grow the number of unique visitors to the website.',
                        'status' => 'not_started',
                    ],
                    [
                        'title' => 'Generate X qualified leads',
                        'description' => 'Deliver high-quality leads to the sales team.',
                        'status' => 'not_started',
                    ],
                    [
                        'title' => 'Achieve X% engagement rate on social media',
                        'description' => 'Improve interaction with content across social media channels.',
                        'status' => 'not_started',
                    ],
                    [
                        'title' => 'Launch X new marketing campaigns',
                        'description' => 'Create and execute targeted marketing campaigns.',
                        'status' => 'not_started',
                    ]
                ],
                'initiatives' => [
                    [
                        'title' => 'Develop content marketing calendar',
                        'description' => 'Create a structured plan for content creation and distribution.',
                        'status' => 'not_started',
                    ],
                    [
                        'title' => 'Optimize SEO strategy',
                        'description' => 'Improve search engine rankings for key terms.',
                        'status' => 'not_started',
                    ],
                    [
                        'title' => 'Implement email marketing automation',
                        'description' => 'Set up automated email sequences for lead nurturing.',
                        'status' => 'not_started',
                    ]
                ]
            ]
        ]);

        // Product Development OKR Template
        OkrTemplate::create([
            'name' => 'Product Development Cycle',
            'description' => 'A template for product teams focusing on feature delivery, quality, and user adoption.',
            'category' => 'Product',
            'department' => 'Product',
            'is_system' => true,
            'template_data' => [
                'objective' => [
                    'title' => 'Deliver impactful product enhancements',
                    'description' => 'Develop and release new features that meet customer needs and increase user satisfaction.',
                    'level' => 'team',
                    'status' => 'not_started',
                ],
                'key_results' => [
                    [
                        'title' => 'Launch X new features',
                        'description' => 'Develop and release planned feature enhancements.',
                        'status' => 'not_started',
                    ],
                    [
                        'title' => 'Achieve X% user adoption of new features',
                        'description' => 'Track and increase usage of recently launched features.',
                        'status' => 'not_started',
                    ],
                    [
                        'title' => 'Reduce bugs by X%',
                        'description' => 'Decrease the number of reported bugs compared to previous release.',
                        'status' => 'not_started',
                    ],
                    [
                        'title' => 'Improve user satisfaction score to X',
                        'description' => 'Increase the product satisfaction rating in user surveys.',
                        'status' => 'not_started',
                    ]
                ],
                'initiatives' => [
                    [
                        'title' => 'Conduct user research sessions',
                        'description' => 'Interview users to gather feedback and insights.',
                        'status' => 'not_started',
                    ],
                    [
                        'title' => 'Implement automated testing framework',
                        'description' => 'Develop comprehensive test suite to prevent regressions.',
                        'status' => 'not_started',
                    ],
                    [
                        'title' => 'Create feature onboarding guides',
                        'description' => 'Develop tutorials and documentation for new features.',
                        'status' => 'not_started',
                    ]
                ]
            ]
        ]);

        // Customer Success OKR Template
        OkrTemplate::create([
            'name' => 'Customer Success Excellence',
            'description' => 'A template for customer success teams focusing on retention, satisfaction, and account growth.',
            'category' => 'Customer Success',
            'department' => 'Customer Success',
            'is_system' => true,
            'template_data' => [
                'objective' => [
                    'title' => 'Maximize customer retention and growth',
                    'description' => 'Ensure customers achieve their goals with our product and expand their usage over time.',
                    'level' => 'team',
                    'status' => 'not_started',
                ],
                'key_results' => [
                    [
                        'title' => 'Improve retention rate to X%',
                        'description' => 'Increase the percentage of customers who renew their contracts.',
                        'status' => 'not_started',
                    ],
                    [
                        'title' => 'Achieve Net Promoter Score of X',
                        'description' => 'Improve customer satisfaction and willingness to recommend.',
                        'status' => 'not_started',
                    ],
                    [
                        'title' => 'Increase customer expansion revenue by X%',
                        'description' => 'Grow additional revenue from existing customers through upsells and cross-sells.',
                        'status' => 'not_started',
                    ],
                    [
                        'title' => 'Reduce average time to resolution to X days',
                        'description' => 'Decrease the time taken to resolve customer issues.',
                        'status' => 'not_started',
                    ]
                ],
                'initiatives' => [
                    [
                        'title' => 'Implement customer health scoring system',
                        'description' => 'Develop a method to identify at-risk and growth-opportunity accounts.',
                        'status' => 'not_started',
                    ],
                    [
                        'title' => 'Create customer success playbooks',
                        'description' => 'Document standardized processes for customer onboarding and success.',
                        'status' => 'not_started',
                    ],
                    [
                        'title' => 'Launch customer education program',
                        'description' => 'Develop training resources to help customers maximize product value.',
                        'status' => 'not_started',
                    ]
                ]
            ]
        ]);

        // Engineering Team OKR Template
        OkrTemplate::create([
            'name' => 'Engineering Excellence',
            'description' => 'A template for engineering teams focusing on code quality, performance, and technical debt.',
            'category' => 'Engineering',
            'department' => 'Engineering',
            'is_system' => true,
            'template_data' => [
                'objective' => [
                    'title' => 'Enhance engineering efficiency and code quality',
                    'description' => 'Improve development processes, reduce technical debt, and increase system performance.',
                    'level' => 'team',
                    'status' => 'not_started',
                ],
                'key_results' => [
                    [
                        'title' => 'Achieve X% code test coverage',
                        'description' => 'Increase the percentage of code covered by automated tests.',
                        'status' => 'not_started',
                    ],
                    [
                        'title' => 'Reduce deployment failures by X%',
                        'description' => 'Decrease the rate of failed deployments to production.',
                        'status' => 'not_started',
                    ],
                    [
                        'title' => 'Improve system response time by X%',
                        'description' => 'Decrease average load time for key application features.',
                        'status' => 'not_started',
                    ],
                    [
                        'title' => 'Resolve X high-priority technical debt items',
                        'description' => 'Address identified technical debt issues.',
                        'status' => 'not_started',
                    ]
                ],
                'initiatives' => [
                    [
                        'title' => 'Implement continuous integration pipeline',
                        'description' => 'Develop automated CI/CD workflow for testing and deployment.',
                        'status' => 'not_started',
                    ],
                    [
                        'title' => 'Conduct system performance audit',
                        'description' => 'Identify bottlenecks and optimization opportunities.',
                        'status' => 'not_started',
                    ],
                    [
                        'title' => 'Create coding standards documentation',
                        'description' => 'Establish and document coding best practices for the team.',
                        'status' => 'not_started',
                    ]
                ]
            ]
        ]);
    }
}